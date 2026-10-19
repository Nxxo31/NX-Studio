#!/usr/bin/env python3
"""
Patch script: añade namespace `portal.*` a es.json, en.json, pt.json.

El namespace es i18n-internal del portal cliente (B7). Lo agregamos
top-level para evitar el bug del fix anterior (`pages.portal.*` que
rompió el call-sites test).

Las keys siguen la jerarquía:
  portal.shell.nav.*       → navegación del portal
  portal.shell.title.*     → títulos de página
  portal.shell.actions.*   → botones (guardar, cancelar, etc.)
  portal.dashboard.*       → /portal/index
  portal.licitacion.*      → /portal/licitacion/[id]
  portal.proyectos.*       → /portal/proyectos
  portal.perfil.*          → /portal/perfil
  portal.mensajes.*        → /portal/mensajes
  portal.profile.*         → copy del form de perfil
  portal.errors.*          → mensajes de error
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "i18n"

# Idéntica estructura para los 3 idiomas. Texto localizado abajo.
PORTAL_KEYS = {
    "shell": {
        "nav": {
            "dashboard": "Dashboard",
            "proyectos": "Proyectos",
            "mensajes": "Mensajes",
            "perfil": "Perfil",
            "logout": "Cerrar sesión",
        },
        "title": {
            "dashboard": "Mi portal — NX-Studio",
            "dashboardDescription": "Tus licitaciones, proyectos y conversaciones con NX-Studio en un solo lugar.",
            "proyectos": "Mis proyectos — NX-Studio",
            "proyectosDescription": "El estado de cada proyecto que tenemos en marcha.",
            "mensajes": "Mensajes — NX-Studio",
            "mensajesDescription": "Tu conversación con el equipo de NX-Studio.",
            "perfil": "Mi perfil — NX-Studio",
            "perfilDescription": "Actualiza tu información de contacto.",
            "licitacion": "Cotización — NX-Studio",
            "licitacionDescription": "Detalle de tu cotización.",
        },
        "actions": {
            "newLicitacion": "Iniciar nueva licitación",
            "save": "Guardar cambios",
            "cancel": "Cancelar",
            "back": "← Volver",
            "edit": "Editar",
            "viewDetail": "Ver detalle",
            "openProject": "Abrir proyecto",
            "openLicitacion": "Ver cotización",
        },
    },
    "dashboard": {
        "welcome": "Hola, {name}",
        "subhead": "Esto es lo que tenemos en marcha contigo.",
        "emptyLicitaciones": "Sin licitaciones todavía.",
        "emptyLicitacionesHelp": "Empieza por cotizar tu proyecto — tarda menos de 3 minutos.",
        "emptyProyectos": "Sin proyectos activos.",
        "emptyProyectosHelp": "Cuando aprobemos una cotización, el proyecto aparecerá aquí.",
        "sectionLicitaciones": "Licitaciones",
        "sectionProyectos": "Proyectos",
        "sectionActividad": "Actividad reciente",
        "emptyActividad": "Sin actividad reciente.",
        "ctaCotizar": "Iniciar nueva licitación",
        "status": {
            "nueva": "Nueva",
            "contactada": "Contactada",
            "propuesta_enviada": "Propuesta enviada",
            "aceptada": "Aceptada",
            "rechazada": "Rechazada",
            "completada": "Completada",
        },
    },
    "licitacion": {
        "heading": "Cotización",
        "labelNombre": "Nombre",
        "labelEmail": "Email",
        "labelTipo": "Tipo de proyecto",
        "labelEngagement": "Modalidad de trabajo",
        "labelFeatures": "Componentes incluidos",
        "labelPricing": "Rango de inversión",
        "labelStatus": "Estado actual",
        "labelFecha": "Fecha de envío",
        "labelEmpresa": "Empresa",
        "labelTelefono": "Teléfono",
        "labelPais": "País",
        "labelUrgencia": "Urgencia",
        "labelDescripcion": "Descripción",
        "labelBanda": "Banda",
        "labelDisplay": "Rango en moneda original",
        "nextMilestone": "Próxima milestone",
        "noMilestone": "Sin milestones abiertas.",
        "backToDashboard": "← Volver al dashboard",
        "notFound": "Cotización no encontrada.",
    },
    "proyectos": {
        "heading": "Mis proyectos",
        "subhead": "Cada proyecto activo con su próxima milestone.",
        "tableName": "Proyecto",
        "tableStatus": "Estado",
        "tableYear": "Año",
        "tableStack": "Stack",
        "tableMilestone": "Próxima milestone",
        "empty": "Sin proyectos visibles todavía.",
        "noMilestone": "—",
        "timeline": "Timeline",
        "noTimeline": "Sin milestones registradas.",
        "milestoneStatus": {
            "pending": "Pendiente",
            "in_progress": "En curso",
            "completed": "Completada",
            "cancelled": "Cancelada",
        },
        "backToList": "← Volver a proyectos",
        "notFound": "Proyecto no encontrado.",
    },
    "perfil": {
        "heading": "Mi perfil",
        "subhead": "Mantén tu información al día para que podamos contactarte.",
        "fieldName": "Nombre completo",
        "fieldEmail": "Email",
        "fieldEmpresa": "Empresa",
        "fieldTelefono": "Teléfono",
        "fieldPais": "País (ISO-2)",
        "savedOk": "Perfil actualizado.",
        "savedError": "No se pudo guardar. Revisa los campos e inténtalo de nuevo.",
        "noSession": "Necesitas iniciar sesión.",
    },
    "mensajes": {
        "heading": "Mensajes",
        "subhead": "Tu conversación con el equipo de NX-Studio.",
        "empty": "Aún no tienes mensajes.",
        "directionInbound": "Tú",
        "directionOutbound": "Operador",
        "noFormPerClient": "Por ahora el envío de mensajes es solo desde el operador. Te avisaremos por email.",
    },
    "profile": {
        "validation": {
            "nameTooShort": "El nombre debe tener al menos 2 caracteres.",
            "emailInvalid": "Email inválido.",
            "paisInvalid": "País debe ser código ISO-2 (2 letras).",
            "emptyBody": "Body vacío.",
        },
    },
    "errors": {
        "unauthorized": "Necesitas iniciar sesión.",
        "notFound": "Recurso no encontrado.",
        "validationFailed": "Validación fallida.",
    },
}

# Localizations (en)
EN_KEYS = json.loads(json.dumps(PORTAL_KEYS))  # deep copy
def set_en():
    EN_KEYS["shell"]["nav"]["dashboard"] = "Dashboard"
    EN_KEYS["shell"]["nav"]["proyectos"] = "Projects"
    EN_KEYS["shell"]["nav"]["mensajes"] = "Messages"
    EN_KEYS["shell"]["nav"]["perfil"] = "Profile"
    EN_KEYS["shell"]["nav"]["logout"] = "Sign out"
    EN_KEYS["shell"]["title"]["dashboard"] = "My portal — NX-Studio"
    EN_KEYS["shell"]["title"]["dashboardDescription"] = "Your bids, projects, and conversations with NX-Studio in one place."
    EN_KEYS["shell"]["title"]["proyectos"] = "My projects — NX-Studio"
    EN_KEYS["shell"]["title"]["proyectosDescription"] = "Status of each project we have in flight."
    EN_KEYS["shell"]["title"]["mensajes"] = "Messages — NX-Studio"
    EN_KEYS["shell"]["title"]["mensajesDescription"] = "Your conversation with the NX-Studio team."
    EN_KEYS["shell"]["title"]["perfil"] = "My profile — NX-Studio"
    EN_KEYS["shell"]["title"]["perfilDescription"] = "Update your contact information."
    EN_KEYS["shell"]["title"]["licitacion"] = "Bid — NX-Studio"
    EN_KEYS["shell"]["title"]["licitacionDescription"] = "Your bid details."
    EN_KEYS["shell"]["actions"]["newLicitacion"] = "Start a new bid"
    EN_KEYS["shell"]["actions"]["save"] = "Save changes"
    EN_KEYS["shell"]["actions"]["cancel"] = "Cancel"
    EN_KEYS["shell"]["actions"]["back"] = "← Back"
    EN_KEYS["shell"]["actions"]["edit"] = "Edit"
    EN_KEYS["shell"]["actions"]["viewDetail"] = "View detail"
    EN_KEYS["shell"]["actions"]["openProject"] = "Open project"
    EN_KEYS["shell"]["actions"]["openLicitacion"] = "View bid"
    EN_KEYS["dashboard"]["welcome"] = "Hi, {name}"
    EN_KEYS["dashboard"]["subhead"] = "Here's what we have going on with you."
    EN_KEYS["dashboard"]["emptyLicitaciones"] = "No bids yet."
    EN_KEYS["dashboard"]["emptyLicitacionesHelp"] = "Start by quoting your project — takes less than 3 minutes."
    EN_KEYS["dashboard"]["emptyProyectos"] = "No active projects."
    EN_KEYS["dashboard"]["emptyProyectosHelp"] = "Once we approve a quote, the project will appear here."
    EN_KEYS["dashboard"]["sectionLicitaciones"] = "Bids"
    EN_KEYS["dashboard"]["sectionProyectos"] = "Projects"
    EN_KEYS["dashboard"]["sectionActividad"] = "Recent activity"
    EN_KEYS["dashboard"]["emptyActividad"] = "No recent activity."
    EN_KEYS["dashboard"]["ctaCotizar"] = "Start a new bid"
    EN_KEYS["dashboard"]["status"]["nueva"] = "New"
    EN_KEYS["dashboard"]["status"]["contactada"] = "Contacted"
    EN_KEYS["dashboard"]["status"]["propuesta_enviada"] = "Proposal sent"
    EN_KEYS["dashboard"]["status"]["aceptada"] = "Accepted"
    EN_KEYS["dashboard"]["status"]["rechazada"] = "Rejected"
    EN_KEYS["dashboard"]["status"]["completada"] = "Completed"
    EN_KEYS["licitacion"]["heading"] = "Bid"
    EN_KEYS["licitacion"]["labelNombre"] = "Name"
    EN_KEYS["licitacion"]["labelEmail"] = "Email"
    EN_KEYS["licitacion"]["labelTipo"] = "Project type"
    EN_KEYS["licitacion"]["labelEngagement"] = "Engagement"
    EN_KEYS["licitacion"]["labelFeatures"] = "Included components"
    EN_KEYS["licitacion"]["labelPricing"] = "Investment range"
    EN_KEYS["licitacion"]["labelStatus"] = "Current status"
    EN_KEYS["licitacion"]["labelFecha"] = "Submitted on"
    EN_KEYS["licitacion"]["labelEmpresa"] = "Company"
    EN_KEYS["licitacion"]["labelTelefono"] = "Phone"
    EN_KEYS["licitacion"]["labelPais"] = "Country"
    EN_KEYS["licitacion"]["labelUrgencia"] = "Urgency"
    EN_KEYS["licitacion"]["labelDescripcion"] = "Description"
    EN_KEYS["licitacion"]["labelBanda"] = "Band"
    EN_KEYS["licitacion"]["labelDisplay"] = "Range in original currency"
    EN_KEYS["licitacion"]["nextMilestone"] = "Next milestone"
    EN_KEYS["licitacion"]["noMilestone"] = "No open milestones."
    EN_KEYS["licitacion"]["backToDashboard"] = "← Back to dashboard"
    EN_KEYS["licitacion"]["notFound"] = "Bid not found."
    EN_KEYS["proyectos"]["heading"] = "My projects"
    EN_KEYS["proyectos"]["subhead"] = "Each active project with its next milestone."
    EN_KEYS["proyectos"]["tableName"] = "Project"
    EN_KEYS["proyectos"]["tableStatus"] = "Status"
    EN_KEYS["proyectos"]["tableYear"] = "Year"
    EN_KEYS["proyectos"]["tableStack"] = "Stack"
    EN_KEYS["proyectos"]["tableMilestone"] = "Next milestone"
    EN_KEYS["proyectos"]["empty"] = "No visible projects yet."
    EN_KEYS["proyectos"]["noMilestone"] = "—"
    EN_KEYS["proyectos"]["timeline"] = "Timeline"
    EN_KEYS["proyectos"]["noTimeline"] = "No milestones recorded."
    EN_KEYS["proyectos"]["milestoneStatus"]["pending"] = "Pending"
    EN_KEYS["proyectos"]["milestoneStatus"]["in_progress"] = "In progress"
    EN_KEYS["proyectos"]["milestoneStatus"]["completed"] = "Completed"
    EN_KEYS["proyectos"]["milestoneStatus"]["cancelled"] = "Cancelled"
    EN_KEYS["proyectos"]["backToList"] = "← Back to projects"
    EN_KEYS["proyectos"]["notFound"] = "Project not found."
    EN_KEYS["perfil"]["heading"] = "My profile"
    EN_KEYS["perfil"]["subhead"] = "Keep your contact info up to date so we can reach you."
    EN_KEYS["perfil"]["fieldName"] = "Full name"
    EN_KEYS["perfil"]["fieldEmail"] = "Email"
    EN_KEYS["perfil"]["fieldEmpresa"] = "Company"
    EN_KEYS["perfil"]["fieldTelefono"] = "Phone"
    EN_KEYS["perfil"]["fieldPais"] = "Country (ISO-2)"
    EN_KEYS["perfil"]["savedOk"] = "Profile updated."
    EN_KEYS["perfil"]["savedError"] = "Could not save. Check the fields and try again."
    EN_KEYS["perfil"]["noSession"] = "Sign in required."
    EN_KEYS["mensajes"]["heading"] = "Messages"
    EN_KEYS["mensajes"]["subhead"] = "Your conversation with the NX-Studio team."
    EN_KEYS["mensajes"]["empty"] = "No messages yet."
    EN_KEYS["mensajes"]["directionInbound"] = "You"
    EN_KEYS["mensajes"]["directionOutbound"] = "Operator"
    EN_KEYS["mensajes"]["noFormPerClient"] = "For now, messaging is one-way from the operator. We'll notify you by email."
    EN_KEYS["profile"]["validation"]["nameTooShort"] = "Name must be at least 2 characters."
    EN_KEYS["profile"]["validation"]["emailInvalid"] = "Invalid email."
    EN_KEYS["profile"]["validation"]["paisInvalid"] = "Country must be ISO-2 (2 letters)."
    EN_KEYS["profile"]["validation"]["emptyBody"] = "Empty body."
    EN_KEYS["errors"]["unauthorized"] = "Sign in required."
    EN_KEYS["errors"]["notFound"] = "Resource not found."
    EN_KEYS["errors"]["validationFailed"] = "Validation failed."

# Localizations (pt)
PT_KEYS = json.loads(json.dumps(PORTAL_KEYS))  # deep copy
def set_pt():
    PT_KEYS["shell"]["nav"]["dashboard"] = "Dashboard"
    PT_KEYS["shell"]["nav"]["proyectos"] = "Projetos"
    PT_KEYS["shell"]["nav"]["mensajes"] = "Mensagens"
    PT_KEYS["shell"]["nav"]["perfil"] = "Perfil"
    PT_KEYS["shell"]["nav"]["logout"] = "Sair"
    PT_KEYS["shell"]["title"]["dashboard"] = "Meu portal — NX-Studio"
    PT_KEYS["shell"]["title"]["dashboardDescription"] = "Suas cotações, projetos e conversas com a NX-Studio em um só lugar."
    PT_KEYS["shell"]["title"]["proyectos"] = "Meus projetos — NX-Studio"
    PT_KEYS["shell"]["title"]["proyectosDescription"] = "Status de cada projeto em andamento."
    PT_KEYS["shell"]["title"]["mensajes"] = "Mensagens — NX-Studio"
    PT_KEYS["shell"]["title"]["mensajesDescription"] = "Sua conversa com a equipe NX-Studio."
    PT_KEYS["shell"]["title"]["perfil"] = "Meu perfil — NX-Studio"
    PT_KEYS["shell"]["title"]["perfilDescription"] = "Atualize suas informações de contato."
    PT_KEYS["shell"]["title"]["licitacion"] = "Cotação — NX-Studio"
    PT_KEYS["shell"]["title"]["licitacionDescription"] = "Detalhes da sua cotação."
    PT_KEYS["shell"]["actions"]["newLicitacion"] = "Iniciar nova cotação"
    PT_KEYS["shell"]["actions"]["save"] = "Salvar alterações"
    PT_KEYS["shell"]["actions"]["cancel"] = "Cancelar"
    PT_KEYS["shell"]["actions"]["back"] = "← Voltar"
    PT_KEYS["shell"]["actions"]["edit"] = "Editar"
    PT_KEYS["shell"]["actions"]["viewDetail"] = "Ver detalhes"
    PT_KEYS["shell"]["actions"]["openProject"] = "Abrir projeto"
    PT_KEYS["shell"]["actions"]["openLicitacion"] = "Ver cotação"
    PT_KEYS["dashboard"]["welcome"] = "Olá, {name}"
    PT_KEYS["dashboard"]["subhead"] = "Isso é o que temos em andamento com você."
    PT_KEYS["dashboard"]["emptyLicitaciones"] = "Sem cotações ainda."
    PT_KEYS["dashboard"]["emptyLicitacionesHelp"] = "Comece cotando seu projeto — leva menos de 3 minutos."
    PT_KEYS["dashboard"]["emptyProyectos"] = "Sem projetos ativos."
    PT_KEYS["dashboard"]["emptyProyectosHelp"] = "Quando aprovamos uma cotação, o projeto aparece aqui."
    PT_KEYS["dashboard"]["sectionLicitaciones"] = "Cotações"
    PT_KEYS["dashboard"]["sectionProyectos"] = "Projetos"
    PT_KEYS["dashboard"]["sectionActividad"] = "Atividade recente"
    PT_KEYS["dashboard"]["emptyActividad"] = "Sem atividade recente."
    PT_KEYS["dashboard"]["ctaCotizar"] = "Iniciar nova cotação"
    PT_KEYS["dashboard"]["status"]["nueva"] = "Nova"
    PT_KEYS["dashboard"]["status"]["contactada"] = "Contatada"
    PT_KEYS["dashboard"]["status"]["propuesta_enviada"] = "Proposta enviada"
    PT_KEYS["dashboard"]["status"]["aceptada"] = "Aceita"
    PT_KEYS["dashboard"]["status"]["rechazada"] = "Recusada"
    PT_KEYS["dashboard"]["status"]["completada"] = "Concluída"
    PT_KEYS["licitacion"]["heading"] = "Cotação"
    PT_KEYS["licitacion"]["labelNombre"] = "Nome"
    PT_KEYS["licitacion"]["labelEmail"] = "Email"
    PT_KEYS["licitacion"]["labelTipo"] = "Tipo de projeto"
    PT_KEYS["licitacion"]["labelEngagement"] = "Modalidade"
    PT_KEYS["licitacion"]["labelFeatures"] = "Componentes incluídos"
    PT_KEYS["licitacion"]["labelPricing"] = "Faixa de investimento"
    PT_KEYS["licitacion"]["labelStatus"] = "Status atual"
    PT_KEYS["licitacion"]["labelFecha"] = "Enviado em"
    PT_KEYS["licitacion"]["labelEmpresa"] = "Empresa"
    PT_KEYS["licitacion"]["labelTelefono"] = "Telefone"
    PT_KEYS["licitacion"]["labelPais"] = "País"
    PT_KEYS["licitacion"]["labelUrgencia"] = "Urgência"
    PT_KEYS["licitacion"]["labelDescripcion"] = "Descrição"
    PT_KEYS["licitacion"]["labelBanda"] = "Faixa"
    PT_KEYS["licitacion"]["labelDisplay"] = "Faixa em moeda original"
    PT_KEYS["licitacion"]["nextMilestone"] = "Próxima milestone"
    PT_KEYS["licitacion"]["noMilestone"] = "Sem milestones abertas."
    PT_KEYS["licitacion"]["backToDashboard"] = "← Voltar ao dashboard"
    PT_KEYS["licitacion"]["notFound"] = "Cotação não encontrada."
    PT_KEYS["proyectos"]["heading"] = "Meus projetos"
    PT_KEYS["proyectos"]["subhead"] = "Cada projeto ativo com sua próxima milestone."
    PT_KEYS["proyectos"]["tableName"] = "Projeto"
    PT_KEYS["proyectos"]["tableStatus"] = "Status"
    PT_KEYS["proyectos"]["tableYear"] = "Ano"
    PT_KEYS["proyectos"]["tableStack"] = "Stack"
    PT_KEYS["proyectos"]["tableMilestone"] = "Próxima milestone"
    PT_KEYS["proyectos"]["empty"] = "Sem projetos visíveis ainda."
    PT_KEYS["proyectos"]["noMilestone"] = "—"
    PT_KEYS["proyectos"]["timeline"] = "Linha do tempo"
    PT_KEYS["proyectos"]["noTimeline"] = "Sem milestones registradas."
    PT_KEYS["proyectos"]["milestoneStatus"]["pending"] = "Pendente"
    PT_KEYS["proyectos"]["milestoneStatus"]["in_progress"] = "Em andamento"
    PT_KEYS["proyectos"]["milestoneStatus"]["completed"] = "Concluída"
    PT_KEYS["proyectos"]["milestoneStatus"]["cancelled"] = "Cancelada"
    PT_KEYS["proyectos"]["backToList"] = "← Voltar aos projetos"
    PT_KEYS["proyectos"]["notFound"] = "Projeto não encontrado."
    PT_KEYS["perfil"]["heading"] = "Meu perfil"
    PT_KEYS["perfil"]["subhead"] = "Mantenha suas informações de contato atualizadas."
    PT_KEYS["perfil"]["fieldName"] = "Nome completo"
    PT_KEYS["perfil"]["fieldEmail"] = "Email"
    PT_KEYS["perfil"]["fieldEmpresa"] = "Empresa"
    PT_KEYS["perfil"]["fieldTelefono"] = "Telefone"
    PT_KEYS["perfil"]["fieldPais"] = "País (ISO-2)"
    PT_KEYS["perfil"]["savedOk"] = "Perfil atualizado."
    PT_KEYS["perfil"]["savedError"] = "Não foi possível salvar. Revise os campos e tente novamente."
    PT_KEYS["perfil"]["noSession"] = "É necessário entrar."
    PT_KEYS["mensajes"]["heading"] = "Mensagens"
    PT_KEYS["mensajes"]["subhead"] = "Sua conversa com a equipe NX-Studio."
    PT_KEYS["mensajes"]["empty"] = "Você ainda não tem mensagens."
    PT_KEYS["mensajes"]["directionInbound"] = "Você"
    PT_KEYS["mensajes"]["directionOutbound"] = "Operador"
    PT_KEYS["mensajes"]["noFormPerClient"] = "Por enquanto, as mensagens são apenas do operador. Avisaremos por email."
    PT_KEYS["profile"]["validation"]["nameTooShort"] = "O nome deve ter pelo menos 2 caracteres."
    PT_KEYS["profile"]["validation"]["emailInvalid"] = "Email inválido."
    PT_KEYS["profile"]["validation"]["paisInvalid"] = "País deve ser ISO-2 (2 letras)."
    PT_KEYS["profile"]["validation"]["emptyBody"] = "Corpo vazio."
    PT_KEYS["errors"]["unauthorized"] = "É necessário entrar."
    PT_KEYS["errors"]["notFound"] = "Recurso não encontrado."
    PT_KEYS["errors"]["validationFailed"] = "Validação falhou."

set_en()
set_pt()

for fname, payload in [
    ("es.json", PORTAL_KEYS),
    ("en.json", EN_KEYS),
    ("pt.json", PT_KEYS),
]:
    p = ROOT / fname
    with open(p, encoding="utf-8") as f:
        data = json.load(f)
    data["portal"] = payload
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{fname}: portal namespace written")

print("DONE")