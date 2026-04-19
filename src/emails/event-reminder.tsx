import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
  Row,
  Column,
} from '@react-email/components';

export type EventReminderProps = {
  // Info del destinatario
  abogadoNombre: string;

  // Info del evento
  tituloEvento: string;
  tipoEvento: string; // "Audiencia", "Plazo legal", etc.
  fechaHora: string; // Ya formateada en español
  lugar?: string | null;

  // Info del expediente
  numeroExpediente: string;
  clienteNombre?: string | null;

  // URL al detalle del expediente
  appUrl: string;
  expedienteId: string;

  // Nivel de urgencia (para colores y tono)
  urgencia: 'tres_dias' | 'un_dia' | 'hoy';
};

export function EventReminderEmail({
  abogadoNombre,
  tituloEvento,
  tipoEvento,
  fechaHora,
  lugar,
  numeroExpediente,
  clienteNombre,
  appUrl,
  expedienteId,
  urgencia,
}: EventReminderProps) {
  // Configuración según urgencia
  const config = {
    tres_dias: {
      emoji: '🔔',
      titulo: 'Recordatorio: evento en 3 días',
      intro: `Te recordamos que tienes un evento programado en 3 días:`,
      color: '#10b981', // verde
      bgHeader: '#d1fae5',
      badgeText: 'En 3 días',
    },
    un_dia: {
      emoji: '⚠️',
      titulo: 'Recordatorio: evento mañana',
      intro: `Tienes un evento programado para mañana. Prepárate:`,
      color: '#f59e0b', // amarillo
      bgHeader: '#fef3c7',
      badgeText: 'Mañana',
    },
    hoy: {
      emoji: '🚨',
      titulo: 'Evento HOY',
      intro: `Este evento es para HOY. No lo olvides:`,
      color: '#ef4444', // rojo
      bgHeader: '#fee2e2',
      badgeText: 'HOY',
    },
  };

  const c = config[urgencia];
  const previewText = `${c.titulo}: ${tituloEvento} - ${fechaHora}`;
  const expedienteUrl = `${appUrl}/legal/cases/${expedienteId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>

      <Body style={body}>
        <Container style={container}>
          {/* HEADER — Logo InnovaAVGT */}
          <Section style={header}>
            <Row>
              <Column>
                <Text style={logo}>
                  ⚖️ InnovaAVGT
                </Text>
                <Text style={tagline}>
                  Sistema de Gestión Jurídica
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ALERTA — Banner con color según urgencia */}
          <Section
            style={{
              ...alertBanner,
              backgroundColor: c.bgHeader,
              borderLeft: `4px solid ${c.color}`,
            }}
          >
            <Text style={{ ...alertTitle, color: c.color }}>
              {c.emoji} {c.titulo}
            </Text>
          </Section>

          {/* SALUDO + INTRO */}
          <Section style={contentSection}>
            <Text style={greeting}>Hola {abogadoNombre},</Text>
            <Text style={paragraph}>{c.intro}</Text>
          </Section>

          {/* CARD DEL EVENTO */}
          <Section style={eventCard}>
            <Text style={eventType}>{tipoEvento}</Text>
            <Text style={eventTitle}>{tituloEvento}</Text>

            <Hr style={hr} />

            <Row style={infoRow}>
              <Column style={infoLabel}>📅 Fecha y hora</Column>
              <Column style={infoValue}>{fechaHora}</Column>
            </Row>

            {lugar && (
              <Row style={infoRow}>
                <Column style={infoLabel}>📍 Lugar</Column>
                <Column style={infoValue}>{lugar}</Column>
              </Row>
            )}

            <Row style={infoRow}>
              <Column style={infoLabel}>📄 Expediente</Column>
              <Column style={infoValueMono}>{numeroExpediente}</Column>
            </Row>

            {clienteNombre && (
              <Row style={infoRow}>
                <Column style={infoLabel}>👤 Cliente</Column>
                <Column style={infoValue}>{clienteNombre}</Column>
              </Row>
            )}
          </Section>

          {/* BOTÓN */}
          <Section style={buttonSection}>
            <Button href={expedienteUrl} style={button}>
              Ver expediente completo
            </Button>
          </Section>

          {/* CONSEJO */}
          <Section style={tipSection}>
            <Text style={tipText}>
              💡 <strong>Consejo:</strong> Prepara con anticipación los documentos
              y memoriales que necesites para este evento.
            </Text>
          </Section>

          {/* FOOTER */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Este correo fue enviado automáticamente por{' '}
              <strong>InnovaAVGT</strong>
            </Text>
            <Text style={footerText}>
              <Link href={appUrl} style={footerLink}>
                Accede al sistema
              </Link>
              {' · '}
              <Link href={`${appUrl}/legal/calendar`} style={footerLink}>
                Ver agenda
              </Link>
            </Text>
            <Text style={footerDisclaimer}>
              Sistema orientado a despachos jurídicos en Guatemala
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Export default para poder usar con `react-email preview`
export default EventReminderEmail;

// ═══════════════════════════════════════════════
// ESTILOS (CSS-in-JS para email)
// ═══════════════════════════════════════════════

const body = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const header = {
  backgroundColor: '#1e293b',
  padding: '24px 32px',
  textAlign: 'left' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
};

const tagline = {
  color: '#94a3b8',
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const alertBanner = {
  padding: '16px 32px',
  margin: '0',
};

const alertTitle = {
  margin: '0',
  fontSize: '15px',
  fontWeight: '600',
};

const contentSection = {
  padding: '24px 32px 8px',
};

const greeting = {
  fontSize: '16px',
  color: '#1e293b',
  margin: '0 0 12px 0',
  fontWeight: '600',
};

const paragraph = {
  fontSize: '15px',
  color: '#475569',
  lineHeight: '1.5',
  margin: '0',
};

const eventCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '16px 32px',
};

const eventType = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
};

const eventTitle = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '16px 0',
};

const infoRow = {
  margin: '10px 0',
};

const infoLabel = {
  color: '#64748b',
  fontSize: '13px',
  width: '40%',
  verticalAlign: 'top' as const,
  padding: '2px 0',
};

const infoValue = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '500',
  padding: '2px 0',
};

const infoValueMono = {
  ...infoValue,
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: '13px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 32px',
};

const button = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 28px',
  borderRadius: '6px',
  display: 'inline-block',
};

const tipSection = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '16px 32px 24px',
};

const tipText = {
  color: '#78350f',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};

const footer = {
  padding: '0 32px 24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '13px',
  margin: '4px 0',
};

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'none',
};

const footerDisclaimer = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '12px 0 0 0',
};