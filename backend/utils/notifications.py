import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# SLA en minutos según prioridad
SLA_LIMITS_MINUTOS = {
    "baja": 1440,
    "media": 240,
    "alta": 60,
    "critica": 30
}

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "soporte.ti@inabie.gob.do")

def enviar_notificacion_correo(destinatario: str, asunto: str, cuerpo: str, es_html: bool = False):
    """
    Envía notificaciones por correo institucional (SMTP / Resend) con fallback a log en consola.
    """
    print(f"\n=======================================================")
    print(f"📧 [CORREO INSTITUCIONAL INABIE]")
    print(f"Para: {destinatario}")
    print(f"Asunto: {asunto}")
    print(f"Mensaje:\n{cuerpo}")
    print(f"=======================================================\n")

    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"INABIE Soporte TI <{SMTP_FROM}>"
            msg["To"] = destinatario
            msg["Subject"] = asunto

            tipo = "html" if es_html else "plain"
            msg.attach(MIMEText(cuerpo, tipo, "utf-8"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"⚠️ Error enviando correo vía SMTP ({SMTP_HOST}): {e}")
            return False
    return True
