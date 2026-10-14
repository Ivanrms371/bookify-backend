# Refactor propuesto de verifications

Estado: propuesta para revisión. Este documento no implementa cambios de código.

## Responsabilidad

`VerificationsService` crea y verifica registros de verificación. No verifica clientes ni usuarios, no cambia contraseñas y no actualiza sus contactos o estados. El módulo consumidor realiza esas acciones después de una verificación exitosa.

Exponer `requestVerification` y `consume` como entrada para los consumidores. `consume` delega en `verifyToken` o `verifyCode`, que mantienen la lógica específica de cada formato. Usar condiciones `if` claras y repositorios. No agregar servicios, capas o abstracciones para este refactor.

## Acceso a datos

- Toda lectura y escritura de verificaciones pasa por `VerificationsRepository`.
- El repositorio acepta `tx?: TransactionClient` y usa la transacción recibida o su cliente habitual.
- Usar `findUnique`, `create` y `update` para los registros individuales.
- No usar `updateMany`, SQL manual, `SELECT FOR UPDATE` ni locks explícitos para verificar o consumir una verificación.
- Un `update` normal sigue usando los locks internos de PostgreSQL; la decisión es no agregar bloqueo explícito desde la aplicación.
- El servicio no depende de `UsersService`, `CustomersService` ni gateways de notificaciones.

## 1. requestVerification

Entrada principal: `recipientId`, `recipientType` y `type`, con `tenantId` opcional para verificaciones de clientes. Cuando se proporciona, guardarlo en la verificación e incluirlo en el evento. La creación se guarda y confirma antes de emitir el evento; este método no comparte una transacción con el listener de notificaciones.

Flujo:

1. Validar que el tipo corresponde al destinatario indicado.
2. Determinar si corresponde un token o un código, su vencimiento y el canal según `type`.
3. Generar el secreto y guardar únicamente su hash mediante el repositorio. La escritura debe estar confirmada antes del siguiente paso.
4. Después de guardar la verificación, emitir exactamente uno de estos eventos:
   - `created.email.verification`
   - `created.phone.verification`
5. Retornar los datos de la verificación creada, sin exponer el token o código en la respuesta pública.

El evento contiene el ID de verificación, destinatario, tipo, vencimiento y el token o código necesario para enviar el mensaje. Incluye contexto de tenant cuando corresponda, pero no una transacción. El listener de notificaciones resuelve el contacto mediante repositorios y prepara la notificación; el servicio de verificaciones no envía mensajes directamente.

No agregar eventos de finalización ni un evento diferente por cada tipo de destinatario. Los dos nombres anteriores son eventos internos; no implican renombrar automáticamente los tipos de plantillas de notificaciones.

Si falla la creación de la notificación, la verificación permanece guardada. No revertirla ni exigir una transacción compartida: el flujo de `resend` permite reutilizar ese registro mientras siga vigente, sin usar y sin bloquear. Como solo se guarda el hash, si el secreto original ya no está disponible, el reenvío genera uno nuevo y actualiza su hash en el mismo registro antes de emitir nuevamente el evento. El envío externo queda a cargo del procesamiento de notificaciones existente.

Mantener inicialmente las reglas actuales: email de usuario y recuperación de contraseña usan token; teléfono y email de cliente usan código. Email de cliente emite el evento de email, aunque use código.

## 2. verifyToken

Entrada: token y tipo esperado; transacción opcional.

1. Buscar por hash del token mediante el repositorio.
2. Con `if`, comprobar existencia, tipo esperado, uso previo (`verifiedAt`), vencimiento (`expiresAt`) y bloqueo (`lockedAt`).
3. Marcar únicamente la verificación como usada mediante `verificationsRepository.markAsVerified(id, tx)`, con un `update` normal.
4. Retornar el resultado con `verificationId`, `recipientId`, `recipientType`, `type` y `tenantId` cuando corresponda.

No marcar email/teléfono de usuario o cliente. No cambiar contraseñas. Esas acciones pertenecen al consumidor y pueden usar la misma transacción.

## 3. verifyCode

Entrada: `verificationId` y `code`; transacción opcional. No buscar por destinatario ni por «última verificación activa».

1. Obtener la verificación por ID mediante el repositorio.
2. Con `if` separados, comprobar existencia y que tenga código, uso previo, vencimiento y bloqueo (`lockedAt` o intentos agotados).
3. Comparar el hash del código recibido con el almacenado.
4. Si el código es incorrecto, incrementar los intentos mediante un `update` del repositorio. Si alcanza el máximo, guardar `lockedAt`. Retornar el resultado `wrong-code`.
5. Si es correcto, marcar únicamente la verificación como usada mediante el repositorio y retornar sus datos.

Resultado sencillo discriminado por `success`: éxito con los datos de la verificación; fallo con `reason` (`not-found`, `used`, `expired`, `locked` o `wrong-code`). No crear una jerarquía adicional de resultados o estrategias.

El consumidor debe dejar que la transacción termine antes de convertir un fallo de código en una excepción HTTP. Lanzar dentro de la transacción después de incrementar intentos revertiría ese incremento.

## 4. consume

`consume(input, tx?)` es la entrada común para validar una verificación y marcarla como usada. El nombre describe ambos pasos; no se limita a consultar si es válida.

Usar una entrada con dos variantes excluyentes, definida en el archivo de tipos del módulo:

```ts
type ConsumeVerificationInput =
  | { token: string; type: VerificationType; verificationId?: never; code?: never }
  | { verificationId: string; code: string; token?: never; type?: never };
```

- Si recibe token, delega en `verifyToken`.
- Si recibe ID y código, delega en `verifyCode`.
- Rechaza entradas vacías, incompletas o que mezclen ambas variantes en la frontera HTTP; los tipos TypeScript no validan un request en runtime.
- Pasa la misma transacción y retorna el resultado del método elegido. No hace consultas adicionales ni actualiza destinatarios.
- Ambos métodos retornan el mismo formato de éxito/fallo descrito arriba, para que el consumidor no tenga que distinguir el formato del secreto.

## Consumidor público de clientes

Ruta solicitada: `POST /public/customers/verification` (con el prefijo global actual: `/api/public/customers/verification`). Recibe una de las variantes de `ConsumeVerificationInput` para completar la verificación del cliente. Las solicitudes actuales de clientes siguen generando códigos; aceptar tokens no cambia esa regla.

El controlador delega en `PublicService`, que solo llama a `CustomersService.confirmContact(input)`. La lógica de confirmación pertenece a `CustomersService`, que:

1. Abre una transacción.
2. Llama a `verifications.consume(input, tx)`.
3. Si falla, retorna el fallo sin actualizar al cliente.
4. Si tiene éxito, comprueba que el resultado corresponde a un cliente y al tenant del registro. Obtiene al cliente mediante su repositorio, con ese scope, y valida que el contacto actual coincide con el destino verificado.
5. Usa un `switch` sobre el tipo:
   - `CUSTOMER_VERIFICATION_EMAIL`: actualiza `emailVerifiedAt` mediante el repositorio de clientes.
   - `CUSTOMER_VERIFICATION_PHONE`: actualiza `phoneVerifiedAt` mediante el repositorio de clientes. El consentimiento de WhatsApp sigue siendo responsabilidad del flujo de clientes, no de verifications.
   - Cualquier otro tipo: rechaza la operación y revierte la transacción.
6. Confirma juntos el consumo de la verificación y la actualización del cliente.

No confiar en un `recipientId` arbitrario enviado por el cliente para decidir a quién actualizar. Usar los datos de la verificación validada. La creación/selección del cliente y la autorización para solicitar una verificación pertenecen al flujo consumidor de clientes. `VerificationsService` no depende de `CustomersService`; la dependencia va de customers hacia verifications.

## Integración pendiente de implementar

- Registrar y exportar el repositorio en `VerificationsModule` según sea necesario.
- Sustituir el listener de `verification.created` por listeners de los dos eventos solicitados.
- Mover las actualizaciones de usuarios al consumidor correspondiente. Recuperación de contraseña sigue consumiendo la verificación y actualizando la contraseña en la misma transacción.
- Adaptar solicitud y reenvío a `requestVerification`, y los consumidores de verificación a `consume`, sin lógica especial de clientes dentro de `VerificationsService`.
- Reemplazar las rutas actuales `public/customer-verification` y `public/customer-verification/verify` según el contrato final. La ruta de solicitud y la compatibilidad con consumidores existentes se concretan antes de cambiar código; la ruta solicitada arriba corresponde a confirmar un contacto mediante `consume`.
- Inspeccionar consumidores en dashboard y web antes de cambiar rutas, eventos o respuestas. No cambiar reglas de consentimiento ni tipos de desafío como efecto secundario.

## Límites y validación

Este diseño usa lectura seguida de `update`, como se solicitó. Una transacción por sí sola no garantiza que dos solicitudes simultáneas no consuman el mismo token/código con este patrón. No agregar mecanismos de concurrencia en este refactor sin revisar esa decisión.

No crear, expandir ni ejecutar tests durante la implementación, salvo petición explícita posterior. Revisar el código y usar un chequeo TypeScript sin emisión cuando corresponda. No ejecutar migraciones ni regenerar Prisma como parte incidental del refactor.
