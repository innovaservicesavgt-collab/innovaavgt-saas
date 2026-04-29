# Sprint 6 - Cerrado el 2026-04-29

## Resumen ejecutivo
Sprint enfocado en madurar el vertical dental con herramientas de gestion clinica
profesional: reportes ejecutivos, recordatorios masivos, documentos legales y
galeria visual del paciente.

## Sub-sprints completados

### 6.1 Reportes ejecutivos
- Ruta: `/dental/dashboard/reports`
- KPIs: ingresos, conversion, ticket promedio, pacientes nuevos
- Graficos: BarChart ingresos, embudo conversion, top 5 servicios, donut metodos pago
- Selector de periodo (7d/30d/6m/12m/ano actual/ano anterior)
- Compartir resumen por WhatsApp

### 6.2 Recordatorios WhatsApp
- Ruta: `/dental/reminders`
- 3 tabs: cuotas vencidas, proximas, citas proximas
- Plantillas pre-armadas con datos del paciente
- Envio masivo escalonado (300ms entre pestanas)
- Vista previa expandible

### 6.3 Documentos clinicos
- Recetas medicas con correlativo Rx-2026-XXXX
- Consentimientos informados con correlativo CI-2026-XXXX
- 7 plantillas legales para Guatemala
- 12 medicamentos dentales pre-cargados
- Vistas imprimibles con membrete y firma
- Modal de firma digital con timestamp

### 6.4 Galeria clinica
- Ruta: `/dental/patients/[id]/gallery`
- 10 categorias visuales con badges
- Drag and drop multi-archivo (max 10MB)
- Vistas: grid, lista, comparador antes/despues
- Lightbox con navegacion por teclado
- Bucket: `patient-files` (Supabase Storage)

## Tablas BD agregadas
- `prescriptions` (recetas)
- `consents` (consentimientos)
- `patient_photos` (metadata de fotos)

## Funciones SQL agregadas
- `generate_prescription_number(p_tenant_id)`
- `generate_consent_number(p_tenant_id)`

## Cliente piloto
Dental Zavala (en produccion)

## Sprint siguiente sugerido
Sprint 7 - Onboarding de nuevos clientes y pagina publica de pago
