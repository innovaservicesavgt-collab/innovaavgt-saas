// Tipos de consentimiento informado y plantillas legales

export type ConsentStatus = 'pending' | 'signed' | 'cancelled';

export type Consent = {
  id: string;
  tenant_id: string;
  patient_id: string;
  professional_id: string | null;
  appointment_id: string | null;
  treatment_plan_id: string | null;
  consent_number: string | null;
  treatment_type: string;
  treatment_description: string;
  risks: string | null;
  alternatives: string | null;
  estimated_cost: number | null;
  estimated_duration: string | null;
  legal_text: string;
  is_signed: boolean;
  signed_at: string | null;
  signed_by_name: string | null;
  signed_by_document: string | null;
  signature_data: string | null;
  notes: string | null;
  status: ConsentStatus;
  issued_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ConsentTemplate = {
  key: string;
  label: string;
  description: string;
  risks: string;
  alternatives: string;
};

// ─── Texto legal base (Guatemala) ────────────────────────
export const LEGAL_TEXT_BASE = 
`Yo, en pleno uso de mis facultades mentales, declaro que he sido informado de manera clara, suficiente y comprensible sobre el procedimiento a realizarse, sus alternativas, riesgos, beneficios y posibles complicaciones.

Manifiesto que he tenido la oportunidad de hacer todas las preguntas que considere necesarias y han sido respondidas a mi entera satisfaccion.

Comprendo que la odontologia no es una ciencia exacta y que no se me puede garantizar un resultado especifico, asi como tambien que pueden surgir situaciones imprevistas durante o despues del tratamiento.

Acepto las posibles complicaciones y los riesgos descritos. En caso de que durante el procedimiento se presenten situaciones imprevistas, autorizo al profesional a tomar las medidas que considere necesarias para proteger mi salud.

Asimismo, autorizo al equipo de la clinica a recopilar y conservar la informacion clinica derivada del tratamiento, conforme a la normativa de proteccion de datos personales aplicable en la Republica de Guatemala.

En constancia de lo anterior, firmo el presente documento de manera libre y voluntaria.`;

// ─── Plantillas por tipo de tratamiento ──────────────────
export const CONSENT_TEMPLATES: ConsentTemplate[] = [
  {
    key: 'endodoncia',
    label: 'Endodoncia (tratamiento de conducto)',
    description: 'Procedimiento que consiste en la remocion del tejido pulpar inflamado o infectado del interior del diente, limpieza, conformacion y obturacion de los conductos radiculares con material biocompatible. Tiene como objetivo conservar el diente natural evitando su extraccion.',
    risks: '- Dolor o molestias post-operatorias durante 24 a 72 horas, controlables con analgesicos.\n- Posible necesidad de retratamiento en caso de complicaciones anatomicas.\n- Fractura de instrumentos endodonticos durante el procedimiento.\n- Perforacion radicular accidental.\n- Cambio de coloracion del diente tratado.\n- Necesidad futura de coronas o restauraciones para proteger el diente debilitado.\n- En casos raros, fracaso del tratamiento que requiera apicectomia o extraccion.',
    alternatives: 'Las alternativas al tratamiento son: 1) la extraccion del diente con posterior reemplazo mediante implante, puente o protesis removible; o 2) no realizar tratamiento alguno, lo cual conllevaria a infeccion progresiva, dolor agudo, perdida del diente y posibles complicaciones sistemicas.',
  },
  {
    key: 'extraccion',
    label: 'Extraccion dental',
    description: 'Remocion quirurgica de una pieza dental indicada por caries irreparable, enfermedad periodontal avanzada, fractura severa, motivos ortodonticos o como parte de un plan de tratamiento integral.',
    risks: '- Sangrado post-operatorio normal por 24 horas.\n- Inflamacion y dolor controlables con medicacion.\n- Alveolitis seca (dolor severo 3-5 dias despues, requiere atencion).\n- Lesion temporal o permanente de nervios adyacentes (mas comun en muelas inferiores).\n- Apertura de seno maxilar (en extracciones superiores).\n- Fractura de tabla osea o dientes adyacentes.\n- Infeccion post-operatoria.\n- Trismus (dificultad para abrir la boca) temporal.',
    alternatives: 'Si la pieza dental tiene posibilidad de conservarse, podrian considerarse: endodoncia, restauraciones complejas, cirugia periodontal, o tratamiento ortodontico segun el caso. La decision de extraer se ha tomado evaluando el pronostico clinico.',
  },
  {
    key: 'ortodoncia',
    label: 'Ortodoncia (brackets o alineadores)',
    description: 'Tratamiento de larga duracion (generalmente 18-30 meses) cuyo objetivo es corregir la posicion de los dientes y la oclusion mediante el uso de aparatologia fija (brackets) o removible (alineadores transparentes), incluyendo controles periodicos.',
    risks: '- Dolor o sensibilidad despues de cada ajuste (3-5 dias).\n- Lesiones en encia, mejillas o labios por roce de los aparatos.\n- Descalcificacion del esmalte si la higiene es deficiente.\n- Reabsorcion radicular (acortamiento de raices).\n- Recidiva si no se usa la retencion indicada.\n- Disfuncion temporomandibular en casos predispuestos.\n- Resultado estetico variable segun cooperacion del paciente.\n- Necesidad de extracciones complementarias en algunos casos.',
    alternatives: 'En adultos, podrian considerarse alternativas como carillas o coronas para mejoras esteticas localizadas, o cirugia ortognatica en casos esqueletales severos. La ortodoncia es la unica opcion para correccion biologica del alineamiento dental.',
  },
  {
    key: 'implante',
    label: 'Implante dental',
    description: 'Procedimiento quirurgico que consiste en la colocacion de un tornillo de titanio en el hueso maxilar o mandibular para reemplazar la raiz de un diente perdido. Posteriormente se coloca un pilar y una corona protesica. El proceso completo tarda 3 a 6 meses.',
    risks: '- Dolor, inflamacion y hematomas en el area quirurgica.\n- Sangrado post-operatorio.\n- Infeccion del area implantada (peri-implantitis).\n- Lesion del nervio dentario inferior (parestesia temporal o permanente).\n- Apertura del seno maxilar.\n- Falta de osteointegracion (rechazo del implante).\n- Necesidad de injertos oseos previos o simultaneos.\n- Movilidad del implante a largo plazo.\n- Fractura de la prótesis sobre el implante.',
    alternatives: 'Las alternativas para reemplazar la pieza ausente son: protesis fija dento-soportada (puente), protesis removible parcial, o la opcion de no reponer el espacio (con consecuencias funcionales y esteticas).',
  },
  {
    key: 'cirugia',
    label: 'Cirugia oral / Tercer molar',
    description: 'Procedimiento quirurgico para extraer dientes retenidos (cordales/muelas del juicio) o realizar otras intervenciones en tejidos blandos y oseos de la cavidad oral. Generalmente requiere odontoseccion y osteotomia.',
    risks: '- Dolor e inflamacion moderada-severa por 5-7 dias.\n- Sangrado y hematomas faciales.\n- Trismus (limitacion de apertura bucal).\n- Infeccion post-operatoria.\n- Alveolitis seca.\n- Lesion del nervio lingual o dentario inferior con posible parestesia temporal o permanente.\n- Fractura mandibular en cordales muy profundos.\n- Apertura del seno maxilar.\n- Necesidad de antibioticos y analgesicos potentes.',
    alternatives: 'En algunos casos, los terceros molares asintomaticos pueden mantenerse en observacion. La extraccion preventiva se recomienda cuando hay riesgo de caries, periodontitis, quistes o problemas ortodonticos.',
  },
  {
    key: 'blanqueamiento',
    label: 'Blanqueamiento dental',
    description: 'Procedimiento estetico que aclara el color de los dientes mediante la aplicacion de geles a base de peroxido de carbamida o peroxido de hidrogeno, ya sea en consultorio o con ferulas para uso domiciliario.',
    risks: '- Sensibilidad dental temporal durante el tratamiento.\n- Irritacion gingival si el gel hace contacto con encias.\n- Resultado variable segun el tipo y origen de la pigmentacion.\n- El blanqueamiento NO funciona en restauraciones, coronas o carillas.\n- Necesidad de retoque cada 1-2 anos.\n- En casos raros, dano del esmalte si se usa fuera de protocolo.',
    alternatives: 'Otras opciones esteticas incluyen: limpieza profunda y pulido para remover manchas extrinsecas, microabrasion del esmalte, carillas de composite, o carillas de porcelana en casos de pigmentaciones severas o intrinsecas.',
  },
  {
    key: 'personalizado',
    label: 'Otro / Personalizado',
    description: '',
    risks: '',
    alternatives: '',
  },
];

export function getTemplateByKey(key: string): ConsentTemplate {
  return CONSENT_TEMPLATES.find((t) => t.key === key) || CONSENT_TEMPLATES[CONSENT_TEMPLATES.length - 1];
}
