/* AI to Word — lógica compartida entre home/pricing/api-access:
   i18n, sesión de Supabase (con guardas defensivas: un fallo de CDN nunca
   debe romper el resto de la página), y los modales de login/signup. */

const I18N = {
  en: {
    warmup: { message: "Waking up the conversion engine — first request may take a few extra seconds…" },
    nav: { home: "Home", pricing: "Pricing", api: "API", login: "Log in", signup: "Sign up", logout: "Log out", myTemplates: "My templates" },
    hero: {
      eyebrow: "Free forever · No signup · No tags, no JSON",
      title: "Your Word template. No tags, no JSON, no code. Paste and download.",
      subtitle: "Paste your AI's answer below and get a clean, formatted Word document in seconds — free and unlimited, no account needed.",
      templateLabel: "Template:",
      templateNone: "Clean default",
      myTemplatesGroup: "My templates",
      titlePlaceholder: "Document title (optional)",
      filenamePlaceholder: "file-name",
      openFileBtn: "Open .md",
      editorPlaceholder: "# Paste your Markdown here...",
      editorTab: "Markdown",
      editorHint: "write, paste or drop a .md here",
      markdownGuideLink: "Markdown guide ↗",
      previewTab: "Preview",
      previewHint: "approximate to the result",
      downloadBtn: "Download .docx",
      converting: "Converting…",
      downloaded: "Document downloaded ✔",
      buildingTitle: "Building your document…",
    },
    proBar: {
      bold: "Bold", italic: "Italic", heading: "Heading",
      bulletList: "Bullet list", numberedList: "Numbered list",
      link: "Link", image: "Image (Pro)", code: "Code", table: "Table",
      togglePreview: "Show/hide preview", help: "Markdown help",
      linkPrompt: "Link URL:",
      imageTooLarge: "Image is too large (max 8 MB).",
      imageBadType: "Unsupported image type — use PNG, JPEG, GIF, BMP or TIFF.",
    },
    howitworks: {
      title: "How it works",
      step1: { title: "Paste", desc: "Drop in the answer your AI gave you — Markdown, plain text, whatever." },
      step2: { title: "Pick a template", desc: "Use the clean default, or your own corporate template with Pro." },
      step3: { title: "Download Word", desc: "Get a ready-to-send .docx in seconds. No tags, no code." },
    },
    proToolbox: {
      title: "Your Pro space",
      subtitle: "Everything you need, one click away — no upsell.",
      convertBtn: "Convert with my template",
      manageBtn: "Manage my templates",
      apiBtn: "API access",
      recentLabel: "Your templates",
      empty: "You haven't uploaded a template yet — start in the studio.",
    },
    compare: {
      title: "Good enough to ship. Better with your own brand.",
      subtitle: "The free output already looks clean. Upload your corporate template once and every future document inherits it automatically.",
      genericLabel: "GENERIC (free)",
      customLabel: "WITH YOUR TEMPLATE",
      proBadge: "PRO",
      cta: "Upload your template — 1 download free",
    },
    usecases: {
      title: "Built for professionals in any sector",
      subtitle: "From a student assignment to a technical report at work — if your AI can write it, we can turn it into Word.",
      case1: { title: "University assignments", desc: "Turn your AI-drafted essay or thesis chapter into a properly formatted document your professor will accept." },
      case2: { title: "Engineering & functional specs", desc: "Structured specs and technical documentation, with tables and headings, ready to share with your team." },
      case3: { title: "QA & technical reports", desc: "Automatic Pass/Fail cell coloring in every results table, straight from your Markdown." },
    },
    promptDemo: {
      title: "Not sure what to ask your AI?",
      subtitle: "Copy this prompt, paste it into your AI, then drop the answer above.",
      promptLines: [
        "Write a formal report about: <your topic here>",
        "",
        "Structure it like this:",
        "- A title (H1) and a short introduction",
        "- 2 to 4 sections with clear H2 headings",
        "- Short paragraphs — no walls of text",
        "- At least one table if there's data to compare",
        "- A short conclusion at the end",
        "",
        "IMPORTANT: give me the WHOLE report as raw Markdown (#, ##, tables)",
        "inside a single code block, as plain text — do NOT render it.",
        "I need to copy the Markdown source itself.",
      ],
      note: "Tip: in Gemini, add \"show it in a code block (plain text)\" or it will format the text instead of giving you the raw Markdown. ChatGPT and Claude usually return it raw already — every AI is a little different.",
      copyBtn: "Copy prompt",
      copiedBtn: "Copied ✔",
    },
    apiTeaser: {
      title: "Ship it inside your own product",
      desc: "A machine-to-machine endpoint authenticated with an API key. Drop it into CI/CD pipelines or your own SaaS.",
      cta: "See API docs",
    },
    footer: { tagline: "AI to Word — paste your AI's answer, download Word. No tags, no JSON, no code." },
    auth: {
      loginTitle: "Log in", signupTitle: "Create account",
      emailPlaceholder: "Email", passwordPlaceholder: "Password", passwordPlaceholderMin: "Password (min. 6 characters)",
      loginSubmit: "Log in", signupSubmit: "Create account",
      switchToSignup: "No account? Sign up", switchToLogin: "Already have an account? Log in",
      notConfigured: "Supabase isn't configured yet.",
      checkEmailTitle: "Check your inbox",
      checkEmailDesc: "We've sent a confirmation link to your email. Confirm it, then log in.",
      closeBtn: "Close",
    },
    wizard: {
      title: "Your corporate template",
      backToLanding: "← Back to home",
      myTemplatesTitle: "Your templates",
      noTemplates: "You haven't uploaded a template yet.",
      newTemplateBtn: "Upload a new template",
      useBtn: "Use this template",
      editBtn: "Edit",
      deleteBtn: "Delete",
      studioLabel: "Template studio",
      tocGuideTitle: "Tip: refresh fields after opening the file",
      tocGuideDesc: "If your template includes a Table of Contents or other Word fields, Word won't update them automatically. Right-click on it and choose “Update Field” (or press F9) after opening your document.",
      tocGuideMenuItem: "Update Field",
      stepUpload: "Upload",
      stepMap: "Map styles",
      stepConvert: "Convert",
      step1Title: "Step 1 — Upload your .dotx/.docx",
      step1Desc: "We store it as-is, nothing is modified.",
      nameLabel: "Template name",
      uploadBtn: "Upload",
      chooseFile: "Choose a .docx/.dotx file first.",
      step2Title: "Step 2 — Style mapping",
      step2Desc: "We tried to auto-detect your styles. Adjust anything that's wrong or missing — this always has a manual fallback.",
      mappingHeading1: "Heading 1 style",
      mappingHeading2: "Heading 2 style",
      mappingHeading3: "Heading 3 style",
      mappingTable: "Table style",
      notDetected: "— not detected, pick one —",
      saveMappingBtn: "Save mapping & continue",
      step3Title: "Step 3 — Test conversion",
      step3Desc: "Paste some Markdown and generate a real .docx with your template.",
      convertBtn: "Convert with my template",
      trialNote: "Free plan: your first download with a custom template is free. After that, upgrading to Pro is required.",
      trialUsedTitle: "You already used your free trial",
      upgradeMessage: "Upgrade to Pro for unlimited downloads with your own template.",
      upgradeCta: "Upgrade to Pro",
      convertedOk: "Document downloaded — this was your free trial download.",
      convertedOkPro: "Document downloaded ✔",
    },
    pricing: {
      title: "Simple pricing",
      subtitle: "Start free. Upgrade only when you need your own template.",
      free: { name: "Free", price: "€0", period: "forever", desc: "The lead magnet — better than the other free converters out there.",
        f1: "Unlimited conversions", f2: "No signup required", f3: "Clean generic template", f4: "Pass/Fail table coloring",
        cta: "Start converting" },
      pro: { name: "Pro", price: "€3.99", period: "/ month", desc: "Less than a coffee a month — for your own corporate template.",
        f1: "Persistent custom .dotx/.docx template", f2: "Automatic style mapping (with manual fallback)", f3: "Conditional rules (Pass/Fail)", f4: "1 free trial download before you pay",
        cta: "Upload your template", currentPlan: "Your current plan" },
      api: { name: "API", price: "Pay per use", period: "", desc: "For CI/CD pipelines and product integrations.",
        f1: "Machine-to-machine endpoint", f2: "Authenticated with an API key", f3: "No per-seat pricing", f4: "Built for automation",
        cta: "Talk to us" },
      faqTitle: "Questions",
      devLink: "Building a product or CI/CD pipeline? See API access →",
      faq1q: "Is the free plan really unlimited?", faq1a: "Yes. It's rate-limited per IP only to stop abuse scripts, never to limit a real person.",
      faq2q: "What happens after my 1 free Pro download?", faq2a: "You'll see a clear upgrade prompt — never a blurred or fake preview. The first download is always the real, complete file.",
      faq3q: "Can I cancel anytime?", faq3a: "Yes. Pro is billed monthly, cancel whenever you want — no lock-in.",
    },
    api: {
      title: "Build document generation into your product",
      subtitle: "A single authenticated endpoint that turns Markdown into a .docx. No SDK required — plain HTTP.",
      authTitle: "Authentication",
      authDesc: "Every request needs an X-API-Key header. Keys are issued per account and never stored in plain text on our side.",
      endpointTitle: "Endpoint",
      requestTitle: "Example request",
      responseTitle: "Response",
      responseDesc: "A binary .docx file (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document), ready to save or stream to your users.",
      paramsTitle: "Form fields",
      paramMarkdown: "the Markdown source (required)",
      paramTemplate: "catalog template ID, or omit for the clean default",
      paramTitle: "document title (used if not already in frontmatter)",
      paramAuthor: "document author (used if not already in frontmatter)",
      paramFilename: "output filename, without extension",
      pricingTitle: "API pricing",
      pricingPlan: "API B2B",
      pricingPrice: "€19.00",
      pricingPeriod: "/ month",
      pricingOverage: "+ €0.05 per conversion over your monthly quota",
      pricingF1: "Server-to-server endpoint (X-API-Key)",
      pricingF2: "For third-party software integrators",
      pricingF3: "No per-seat pricing",
      pricingF4: "Usage-based billing, cancel anytime",
      ctaTitle: "Want access?",
      ctaDesc: "Tell us about your use case and we'll set you up with a key.",
      cta: "Get API access",
    },
  },
  es: {
    warmup: { message: "Despertando el motor de conversión — la primera petición puede tardar unos segundos más…" },
    nav: { home: "Inicio", pricing: "Precios", api: "API", login: "Entrar", signup: "Crear cuenta", logout: "Salir", myTemplates: "Mis plantillas" },
    hero: {
      eyebrow: "Gratis para siempre · Sin registro · Sin tags, sin JSON",
      title: "Tu plantilla de Word. Sin tags, sin JSON, sin código. Pega y descarga.",
      subtitle: "Pega aquí la respuesta de tu IA y consigue un documento Word limpio y formateado en segundos — gratis e ilimitado, sin cuenta.",
      templateLabel: "Plantilla:",
      templateNone: "Genérica limpia",
      myTemplatesGroup: "Mis plantillas",
      titlePlaceholder: "Título del documento (opcional)",
      filenamePlaceholder: "nombre-fichero",
      openFileBtn: "Abrir .md",
      editorPlaceholder: "# Pega aquí tu Markdown...",
      editorTab: "Markdown",
      editorHint: "escribe, pega o arrastra un .md aquí",
      markdownGuideLink: "Guía de Markdown ↗",
      previewTab: "Vista previa",
      previewHint: "aproximada al resultado",
      downloadBtn: "Descargar .docx",
      converting: "Convirtiendo…",
      downloaded: "Documento descargado ✔",
      buildingTitle: "Generando tu documento…",
    },
    proBar: {
      bold: "Negrita", italic: "Cursiva", heading: "Encabezado",
      bulletList: "Lista", numberedList: "Lista numerada",
      link: "Enlace", image: "Imagen (Pro)", code: "Código", table: "Tabla",
      togglePreview: "Mostrar/ocultar vista previa", help: "Ayuda de Markdown",
      linkPrompt: "URL del enlace:",
      imageTooLarge: "La imagen es demasiado grande (máx. 8 MB).",
      imageBadType: "Tipo de imagen no soportado — usa PNG, JPEG, GIF, BMP o TIFF.",
    },
    howitworks: {
      title: "Cómo funciona",
      step1: { title: "Pega", desc: "Suelta la respuesta que te dio tu IA — Markdown, texto plano, lo que sea." },
      step2: { title: "Elige plantilla", desc: "Usa la genérica limpia, o tu propia plantilla corporativa con Pro." },
      step3: { title: "Descarga Word", desc: "Consigue un .docx listo para enviar en segundos. Sin tags, sin código." },
    },
    proToolbox: {
      title: "Tu espacio Pro",
      subtitle: "Todo lo que necesitas, a un clic — sin publicidad de upgrade.",
      convertBtn: "Convertir con mi plantilla",
      manageBtn: "Gestionar mis plantillas",
      apiBtn: "Acceso API",
      recentLabel: "Tus plantillas",
      empty: "Todavía no has subido ninguna plantilla — empieza en el studio.",
    },
    compare: {
      title: "Listo para usar tal cual. Mejor con tu propia marca.",
      subtitle: "El resultado gratuito ya es limpio. Sube tu plantilla corporativa una vez y cada documento futuro la hereda automáticamente.",
      genericLabel: "GENÉRICO (gratis)",
      customLabel: "CON TU PLANTILLA",
      proBadge: "PRO",
      cta: "Sube tu plantilla — 1 descarga gratis",
    },
    usecases: {
      title: "Pensado para profesionales de cualquier sector",
      subtitle: "Desde un trabajo universitario hasta un informe técnico en el trabajo — si tu IA puede escribirlo, nosotros lo convertimos a Word.",
      case1: { title: "Trabajos universitarios", desc: "Convierte el ensayo o capítulo de TFG que redactó tu IA en un documento con el formato que pide tu profesor." },
      case2: { title: "Ingeniería y especificaciones funcionales", desc: "Especificaciones y documentación técnica estructurada, con tablas y encabezados, lista para compartir con tu equipo." },
      case3: { title: "QA / informes técnicos", desc: "Coloreado automático Pass/Fail en cada tabla de resultados, directo desde tu Markdown." },
    },
    promptDemo: {
      title: "¿No sabes qué pedirle a tu IA?",
      subtitle: "Copia este prompt, pégalo en tu IA, y luego pega aquí arriba la respuesta.",
      promptLines: [
        "Escribe un informe formal sobre: <tu tema aquí>",
        "",
        "Estrúctúralo así:",
        "- Un título (H1) y una breve introducción",
        "- De 2 a 4 secciones con encabezados H2 claros",
        "- Párrafos cortos — nada de bloques de texto enormes",
        "- Al menos una tabla si hay datos que comparar",
        "- Una breve conclusión al final",
        "",
        "IMPORTANTE: dame TODO el informe como Markdown en bruto (#, ##, tablas)",
        "dentro de un único bloque de código, como texto plano — NO lo renderices.",
        "Necesito copiar el propio código Markdown.",
      ],
      note: "Truco: en Gemini, añade \"muéstramelo en un bloque de código (texto plano)\" o te formateará el texto en vez de darte el Markdown en bruto. ChatGPT y Claude suelen devolverlo ya en bruto — cada IA es un poco distinta.",
      copyBtn: "Copiar prompt",
      copiedBtn: "Copiado ✔",
    },
    apiTeaser: {
      title: "Intégralo en tu propio producto",
      desc: "Un endpoint máquina a máquina autenticado con una API key. Para pipelines de CI/CD o tu propio SaaS.",
      cta: "Ver documentación de la API",
    },
    footer: { tagline: "AI to Word — pega la respuesta de tu IA, descarga Word. Sin tags, sin JSON, sin código." },
    auth: {
      loginTitle: "Iniciar sesión", signupTitle: "Crear cuenta",
      emailPlaceholder: "Email", passwordPlaceholder: "Contraseña", passwordPlaceholderMin: "Contraseña (mín. 6 caracteres)",
      loginSubmit: "Entrar", signupSubmit: "Crear cuenta",
      switchToSignup: "¿No tienes cuenta? Regístrate", switchToLogin: "¿Ya tienes cuenta? Entra",
      notConfigured: "Supabase no está configurado todavía.",
      checkEmailTitle: "Revisa tu correo",
      checkEmailDesc: "Te hemos enviado un enlace de confirmación a tu email. Confírmalo y luego inicia sesión.",
      closeBtn: "Cerrar",
    },
    wizard: {
      title: "Tu plantilla corporativa",
      backToLanding: "← Volver al inicio",
      myTemplatesTitle: "Tus plantillas",
      noTemplates: "Todavía no has subido ninguna plantilla.",
      newTemplateBtn: "Subir una plantilla nueva",
      useBtn: "Usar esta plantilla",
      editBtn: "Editar",
      deleteBtn: "Borrar",
      studioLabel: "Estudio de plantillas",
      tocGuideTitle: "Consejo: actualiza los campos al abrir el archivo",
      tocGuideDesc: "Si tu plantilla incluye un índice u otros campos de Word, no se actualizan solos. Haz clic derecho sobre él y elige “Actualizar campos” (o pulsa F9) al abrir tu documento.",
      tocGuideMenuItem: "Actualizar campos",
      stepUpload: "Subir",
      stepMap: "Mapear estilos",
      stepConvert: "Convertir",
      step1Title: "Paso 1 — Sube tu .dotx/.docx",
      step1Desc: "La guardamos tal cual, sin modificarla.",
      nameLabel: "Nombre de la plantilla",
      uploadBtn: "Subir",
      chooseFile: "Elige primero un fichero .docx/.dotx.",
      step2Title: "Paso 2 — Mapeo de estilos",
      step2Desc: "Intentamos detectar tus estilos automáticamente. Ajusta lo que falte o esté mal — siempre hay un fallback manual.",
      mappingHeading1: "Estilo para Heading 1",
      mappingHeading2: "Estilo para Heading 2",
      mappingHeading3: "Estilo para Heading 3",
      mappingTable: "Estilo de tabla",
      notDetected: "— sin detectar, elige uno —",
      saveMappingBtn: "Guardar mapeo y continuar",
      step3Title: "Paso 3 — Conversión de prueba",
      step3Desc: "Pega algo de Markdown y genera un .docx real con tu plantilla.",
      convertBtn: "Convertir con mi plantilla",
      trialNote: "Plan free: tu primera descarga con plantilla propia es gratis. Después, hace falta Pro.",
      trialUsedTitle: "Ya usaste tu prueba gratuita",
      upgradeMessage: "Hazte Pro para descargas ilimitadas con tu propia plantilla.",
      upgradeCta: "Hazte Pro",
      convertedOk: "Documento descargado — esta era tu descarga de prueba gratuita.",
      convertedOkPro: "Documento descargado ✔",
    },
    pricing: {
      title: "Precios simples",
      subtitle: "Empieza gratis. Paga solo cuando necesites tu propia plantilla.",
      free: { name: "Free", price: "0€", period: "para siempre", desc: "El anzuelo — mejor que el resto de conversores gratuitos.",
        f1: "Conversiones ilimitadas", f2: "Sin registro", f3: "Plantilla genérica limpia", f4: "Coloreado Pass/Fail en tablas",
        cta: "Empezar a convertir" },
      pro: { name: "Pro", price: "3,99€", period: "/ mes", desc: "Menos que un café al mes — para tu propia plantilla corporativa.",
        f1: "Plantilla .dotx/.docx propia y persistente", f2: "Auto-mapeo de estilos (con fallback manual)", f3: "Reglas condicionales (Pass/Fail)", f4: "1 descarga de prueba gratis antes de pagar",
        cta: "Sube tu plantilla", currentPlan: "Tu plan actual" },
      api: { name: "API", price: "Por uso", period: "", desc: "Para pipelines de CI/CD e integraciones de producto.",
        f1: "Endpoint máquina a máquina", f2: "Autenticado con API key", f3: "Sin coste por asiento", f4: "Pensado para automatización",
        cta: "Hablemos" },
      faqTitle: "Preguntas frecuentes",
      devLink: "¿Construyes un producto o un pipeline de CI/CD? Mira el acceso API →",
      faq1q: "¿El plan free es de verdad ilimitado?", faq1a: "Sí. Solo tiene un límite por IP para frenar scripts de abuso, nunca para limitar a una persona real.",
      faq2q: "¿Qué pasa tras mi 1 descarga gratis de Pro?", faq2a: "Verás un aviso claro para hacerte Pro — nunca una preview difuminada o falsa. La primera descarga siempre es el fichero real y completo.",
      faq3q: "¿Puedo cancelar cuando quiera?", faq3a: "Sí. Pro se factura mensualmente, cancela cuando quieras — sin permanencia.",
    },
    api: {
      title: "Integra la generación de documentos en tu producto",
      subtitle: "Un único endpoint autenticado que convierte Markdown en .docx. Sin SDK — HTTP puro.",
      authTitle: "Autenticación",
      authDesc: "Cada request necesita un header X-API-Key. Las claves se emiten por cuenta y nunca se guardan en texto plano en nuestro lado.",
      endpointTitle: "Endpoint",
      requestTitle: "Ejemplo de request",
      responseTitle: "Respuesta",
      responseDesc: "Un fichero .docx binario (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document), listo para guardar o servir a tus usuarios.",
      paramsTitle: "Campos del formulario",
      paramMarkdown: "el Markdown de origen (obligatorio)",
      paramTemplate: "ID de plantilla del catálogo, u omite para la genérica limpia",
      paramTitle: "título del documento (si no viene ya en el frontmatter)",
      paramAuthor: "autor del documento (si no viene ya en el frontmatter)",
      paramFilename: "nombre del fichero de salida, sin extensión",
      pricingTitle: "Precio de la API",
      pricingPlan: "API B2B",
      pricingPrice: "19,00€",
      pricingPeriod: "/ mes",
      pricingOverage: "+ 0,05€ por conversión de overage sobre tu cuota mensual",
      pricingF1: "Endpoint server-to-server (X-API-Key)",
      pricingF2: "Para integradores de software de terceros",
      pricingF3: "Sin coste por asiento",
      pricingF4: "Facturación por uso, cancela cuando quieras",
      ctaTitle: "¿Quieres acceso?",
      ctaDesc: "Cuéntanos tu caso de uso y te damos una clave.",
      cta: "Solicitar acceso API",
    },
  },
  fr: {
    warmup: { message: "Réveil du moteur de conversion — la première requête peut prendre quelques secondes de plus…" },
    nav: { home: "Accueil", pricing: "Tarifs", api: "API", login: "Connexion", signup: "S'inscrire", logout: "Déconnexion", myTemplates: "Mes modèles" },
    hero: {
      eyebrow: "Gratuit pour toujours · Sans inscription · Sans tags, sans JSON",
      title: "Votre modèle Word. Sans tags, sans JSON, sans code. Collez et téléchargez.",
      subtitle: "Collez la réponse de votre IA ci-dessous et obtenez un document Word propre et formaté en quelques secondes — gratuit et illimité, sans compte.",
      templateLabel: "Modèle :",
      templateNone: "Modèle par défaut",
      myTemplatesGroup: "Mes modèles",
      titlePlaceholder: "Titre du document (facultatif)",
      filenamePlaceholder: "nom-du-fichier",
      openFileBtn: "Ouvrir .md",
      editorPlaceholder: "# Collez votre Markdown ici...",
      editorTab: "Markdown",
      editorHint: "écrivez, collez ou déposez un .md ici",
      markdownGuideLink: "Guide Markdown ↗",
      previewTab: "Aperçu",
      previewHint: "approximatif du résultat",
      downloadBtn: "Télécharger .docx",
      converting: "Conversion…",
      downloaded: "Document téléchargé ✔",
      buildingTitle: "Génération de votre document…",
    },
    proBar: {
      bold: "Gras", italic: "Italique", heading: "Titre",
      bulletList: "Liste à puces", numberedList: "Liste numérotée",
      link: "Lien", image: "Image (Pro)", code: "Code", table: "Tableau",
      togglePreview: "Afficher/masquer l'aperçu", help: "Aide Markdown",
      linkPrompt: "URL du lien :",
      imageTooLarge: "L'image est trop volumineuse (max 8 Mo).",
      imageBadType: "Type d'image non pris en charge — utilisez PNG, JPEG, GIF, BMP ou TIFF.",
    },
    howitworks: {
      title: "Comment ça marche",
      step1: { title: "Collez", desc: "Déposez la réponse de votre IA — Markdown, texte brut, peu importe." },
      step2: { title: "Choisissez un modèle", desc: "Utilisez le modèle par défaut, ou votre propre modèle d'entreprise avec Pro." },
      step3: { title: "Téléchargez Word", desc: "Obtenez un .docx prêt à envoyer en quelques secondes. Sans tags, sans code." },
    },
    proToolbox: {
      title: "Votre espace Pro",
      subtitle: "Tout ce dont vous avez besoin, en un clic — sans publicité.",
      convertBtn: "Convertir avec mon modèle",
      manageBtn: "Gérer mes modèles",
      apiBtn: "Accès API",
      recentLabel: "Vos modèles",
      empty: "Vous n'avez pas encore importé de modèle — commencez dans le studio.",
    },
    compare: {
      title: "Prêt à l'emploi. Encore mieux avec votre marque.",
      subtitle: "Le résultat gratuit est déjà propre. Importez votre modèle d'entreprise une fois et chaque futur document en hérite automatiquement.",
      genericLabel: "GÉNÉRIQUE (gratuit)",
      customLabel: "AVEC VOTRE MODÈLE",
      proBadge: "PRO",
      cta: "Importez votre modèle — 1 téléchargement gratuit",
    },
    usecases: {
      title: "Conçu pour les professionnels de tous les secteurs",
      subtitle: "D'un devoir universitaire à un rapport technique au travail — si votre IA peut l'écrire, nous pouvons le convertir en Word.",
      case1: { title: "Travaux universitaires", desc: "Transformez l'essai ou le chapitre de mémoire rédigé par votre IA en un document au format attendu par votre professeur." },
      case2: { title: "Ingénierie et spécifications fonctionnelles", desc: "Spécifications et documentation technique structurées, avec tableaux et titres, prêtes à partager avec votre équipe." },
      case3: { title: "QA / rapports techniques", desc: "Coloration automatique Pass/Fail dans chaque tableau de résultats, directement depuis votre Markdown." },
    },
    promptDemo: {
      title: "Vous ne savez pas quoi demander à votre IA ?",
      subtitle: "Copiez ce prompt, collez-le dans votre IA, puis déposez la réponse ci-dessus.",
      promptLines: [
        "Rédige un rapport formel sur : <ton sujet ici>",
        "",
        "Structure-le ainsi :",
        "- Un titre (H1) et une courte introduction",
        "- 2 à 4 sections avec des titres H2 clairs",
        "- Des paragraphes courts — pas de pavés de texte",
        "- Au moins un tableau s'il y a des données à comparer",
        "- Une courte conclusion à la fin",
        "",
        "IMPORTANT : donne-moi TOUT le rapport en Markdown brut (#, ##, tableaux)",
        "dans un seul bloc de code, en texte brut — NE le rends PAS.",
        "J'ai besoin de copier le code Markdown lui-même.",
      ],
      note: "Astuce : sur Gemini, ajoute \"affiche-le dans un bloc de code (texte brut)\" sinon il formatera le texte au lieu de te donner le Markdown brut. ChatGPT et Claude le renvoient généralement déjà brut — chaque IA est un peu différente.",
      copyBtn: "Copier le prompt",
      copiedBtn: "Copié ✔",
    },
    apiTeaser: {
      title: "Intégrez-le dans votre propre produit",
      desc: "Un endpoint machine à machine authentifié par une clé API. À intégrer dans vos pipelines CI/CD ou votre propre SaaS.",
      cta: "Voir la documentation de l'API",
    },
    footer: { tagline: "AI to Word — collez la réponse de votre IA, téléchargez Word. Sans tags, sans JSON, sans code." },
    auth: {
      loginTitle: "Connexion", signupTitle: "Créer un compte",
      emailPlaceholder: "Email", passwordPlaceholder: "Mot de passe", passwordPlaceholderMin: "Mot de passe (min. 6 caractères)",
      loginSubmit: "Connexion", signupSubmit: "Créer un compte",
      switchToSignup: "Pas de compte ? Inscrivez-vous", switchToLogin: "Déjà un compte ? Connectez-vous",
      notConfigured: "Supabase n'est pas encore configuré.",
      checkEmailTitle: "Consultez votre boîte mail",
      checkEmailDesc: "Nous avons envoyé un lien de confirmation à votre email. Confirmez-le, puis connectez-vous.",
      closeBtn: "Fermer",
    },
    wizard: {
      title: "Votre modèle d'entreprise",
      backToLanding: "← Retour à l'accueil",
      myTemplatesTitle: "Vos modèles",
      noTemplates: "Vous n'avez pas encore importé de modèle.",
      newTemplateBtn: "Importer un nouveau modèle",
      useBtn: "Utiliser ce modèle",
      editBtn: "Modifier",
      deleteBtn: "Supprimer",
      studioLabel: "Studio de modèles",
      tocGuideTitle: "Astuce : actualisez les champs après avoir ouvert le fichier",
      tocGuideDesc: "Si votre modèle contient une table des matières ou d'autres champs Word, Word ne les met pas à jour automatiquement. Faites un clic droit dessus et choisissez « Mettre à jour les champs » (ou appuyez sur F9) après avoir ouvert votre document.",
      tocGuideMenuItem: "Mettre à jour les champs",
      stepUpload: "Import",
      stepMap: "Associer les styles",
      stepConvert: "Convertir",
      step1Title: "Étape 1 — Importez votre .dotx/.docx",
      step1Desc: "Nous le conservons tel quel, rien n'est modifié.",
      nameLabel: "Nom du modèle",
      uploadBtn: "Importer",
      chooseFile: "Choisissez d'abord un fichier .docx/.dotx.",
      step2Title: "Étape 2 — Association des styles",
      step2Desc: "Nous avons essayé de détecter vos styles automatiquement. Ajustez ce qui est incorrect ou manquant — un choix manuel reste toujours possible.",
      mappingHeading1: "Style pour Titre 1",
      mappingHeading2: "Style pour Titre 2",
      mappingHeading3: "Style pour Titre 3",
      mappingTable: "Style de tableau",
      notDetected: "— non détecté, choisissez-en un —",
      saveMappingBtn: "Enregistrer et continuer",
      step3Title: "Étape 3 — Conversion de test",
      step3Desc: "Collez du Markdown et générez un vrai .docx avec votre modèle.",
      convertBtn: "Convertir avec mon modèle",
      trialNote: "Plan gratuit : votre premier téléchargement avec un modèle personnalisé est gratuit. Ensuite, un abonnement Pro est nécessaire.",
      trialUsedTitle: "Vous avez déjà utilisé votre essai gratuit",
      upgradeMessage: "Passez à Pro pour des téléchargements illimités avec votre propre modèle.",
      upgradeCta: "Passer à Pro",
      convertedOk: "Document téléchargé — c'était votre téléchargement d'essai gratuit.",
      convertedOkPro: "Document téléchargé ✔",
    },
    pricing: {
      title: "Tarifs simples",
      subtitle: "Commencez gratuitement. Passez à l'offre supérieure seulement si vous avez besoin de votre propre modèle.",
      free: { name: "Gratuit", price: "0 €", period: "pour toujours", desc: "L'accroche — meilleur que les autres convertisseurs gratuits du marché.",
        f1: "Conversions illimitées", f2: "Sans inscription", f3: "Modèle générique propre", f4: "Coloration Pass/Fail dans les tableaux",
        cta: "Commencer à convertir" },
      pro: { name: "Pro", price: "3,99 €", period: "/ mois", desc: "Moins qu'un café par mois — pour votre propre modèle d'entreprise.",
        f1: "Modèle .dotx/.docx personnel et persistant", f2: "Association automatique des styles (avec réglage manuel)", f3: "Règles conditionnelles (Pass/Fail)", f4: "1 téléchargement d'essai gratuit avant de payer",
        cta: "Importez votre modèle", currentPlan: "Votre offre actuelle" },
      api: { name: "API", price: "Paiement à l'usage", period: "", desc: "Pour les pipelines CI/CD et les intégrations produit.",
        f1: "Endpoint machine à machine", f2: "Authentifié par clé API", f3: "Sans coût par utilisateur", f4: "Conçu pour l'automatisation",
        cta: "Contactez-nous" },
      faqTitle: "Questions",
      devLink: "Vous développez un produit ou un pipeline CI/CD ? Voir l'accès API →",
      faq1q: "Le plan gratuit est-il vraiment illimité ?", faq1a: "Oui. Il est limité par IP uniquement pour stopper les scripts abusifs, jamais pour limiter une personne réelle.",
      faq2q: "Que se passe-t-il après mon téléchargement Pro gratuit ?", faq2a: "Vous verrez une invitation claire à passer à Pro — jamais un aperçu flouté ou factice. Le premier téléchargement est toujours le fichier réel et complet.",
      faq3q: "Puis-je annuler à tout moment ?", faq3a: "Oui. Pro est facturé mensuellement, annulez quand vous voulez — sans engagement.",
    },
    api: {
      title: "Intégrez la génération de documents dans votre produit",
      subtitle: "Un seul endpoint authentifié qui transforme du Markdown en .docx. Aucun SDK requis — HTTP simple.",
      authTitle: "Authentification",
      authDesc: "Chaque requête nécessite un en-tête X-API-Key. Les clés sont émises par compte et ne sont jamais stockées en clair de notre côté.",
      endpointTitle: "Endpoint",
      requestTitle: "Exemple de requête",
      responseTitle: "Réponse",
      responseDesc: "Un fichier .docx binaire (Content-Type : application/vnd.openxmlformats-officedocument.wordprocessingml.document), prêt à enregistrer ou à servir à vos utilisateurs.",
      paramsTitle: "Champs du formulaire",
      paramMarkdown: "la source Markdown (obligatoire)",
      paramTemplate: "ID de modèle du catalogue, ou à omettre pour le modèle par défaut",
      paramTitle: "titre du document (utilisé s'il n'est pas déjà dans le frontmatter)",
      paramAuthor: "auteur du document (utilisé s'il n'est pas déjà dans le frontmatter)",
      paramFilename: "nom du fichier de sortie, sans extension",
      pricingTitle: "Tarifs de l'API",
      pricingPlan: "API B2B",
      pricingPrice: "19,00 €",
      pricingPeriod: "/ mois",
      pricingOverage: "+ 0,05 € par conversion au-delà de votre quota mensuel",
      pricingF1: "Endpoint serveur à serveur (X-API-Key)",
      pricingF2: "Pour les intégrateurs de logiciels tiers",
      pricingF3: "Sans coût par utilisateur",
      pricingF4: "Facturation à l'usage, annulez à tout moment",
      ctaTitle: "Vous voulez y accéder ?",
      ctaDesc: "Parlez-nous de votre cas d'usage et nous vous fournirons une clé.",
      cta: "Demander l'accès API",
    },
  },
};

const state = {
  lang: localStorage.getItem("formalize_lang") || "en",
  session: null,
  tier: null,
};

// ---------------------------------------------------------------------
// Loading animation reutilizable (conversión hero + wizard paso 3): siempre
// se muestra un mínimo de tiempo para dar sensación de trabajo real, incluso
// si el backend responde antes (ver punto 4 de la ronda de UX de julio).
// ---------------------------------------------------------------------
function withMinDuration(promise, ms) {
  const timer = new Promise((resolve) => setTimeout(resolve, ms));
  return Promise.all([promise, timer]).then(([result]) => result);
}

function createLoadingWidget() {
  const wrap = document.createElement("div");
  wrap.className = "ai2w-loading";
  wrap.innerHTML =
    '<div class="ai2w-loading-ring"></div>' +
    '<div class="ai2w-loading-doc"><span></span><span></span><span></span></div>' +
    '<p class="ai2w-loading-text"></p>';
  wrap.querySelector(".ai2w-loading-text").textContent = t("hero.buildingTitle");
  return wrap;
}

function showLoadingIn(root) {
  hideLoadingIn(root);
  const widget = createLoadingWidget();
  root._ai2wLoading = widget;
  root.appendChild(widget);
}

function hideLoadingIn(root) {
  if (root._ai2wLoading) {
    root._ai2wLoading.remove();
    root._ai2wLoading = null;
  }
}

function t(key) {
  const parts = key.split(".");
  let obj = I18N[state.lang];
  for (const p of parts) obj = obj?.[p];
  return obj ?? key;
}

// Ciclo de idiomas del botón: en -> es -> fr -> en... El botón siempre
// muestra el idioma AL QUE se cambiará al pulsar (no el actual).
const LANGS = ["en", "es", "fr"];

function nextLang(lang) {
  return LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.textContent = nextLang(state.lang).toUpperCase();
}

function initLangToggle(onChange) {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    state.lang = nextLang(state.lang);
    localStorage.setItem("formalize_lang", state.lang);
    applyI18n();
    if (onChange) onChange();
  });
}

// ---------------------------------------------------------------------
// Supabase client — nunca debe poder tumbar el resto de la página: si el
// CDN de supabase-js falla (bloqueador de anuncios, red, CDN caído), el
// conversor gratuito (que no depende de Supabase para nada) sigue
// funcionando igual. Login/signup/wizard se degradan solos.
// ---------------------------------------------------------------------
let supabaseClient = null;

function initSupabase(config) {
  try {
    if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY && typeof supabase !== "undefined") {
      supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    }
  } catch (err) {
    console.warn("Supabase client unavailable, continuing without auth:", err);
  }
  return supabaseClient;
}

async function getAuthHeader() {
  if (!supabaseClient) return {};
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("flex");
  if (id === "signup-overlay") resetSignupModal();
}

/**
 * Tras un signup sin sesión inmediata (confirmación de email requerida), el
 * modal cambia a una pantalla de "revisa tu correo" en vez de dejar el
 * formulario ahí con un mensajito de texto — se restaura al formulario la
 * próxima vez que se abra (ver closeModal).
 */
function resetSignupModal() {
  const form = document.getElementById("signup-form");
  const success = document.getElementById("signup-success");
  if (!form || !success) return;
  form.classList.remove("hidden");
  success.classList.add("hidden");
  const password = document.getElementById("signup-password");
  if (password) password.value = "";
}

function showSignupCheckEmail() {
  const form = document.getElementById("signup-form");
  const success = document.getElementById("signup-success");
  if (!form || !success) return;
  form.classList.add("hidden");
  success.classList.remove("hidden");
  const password = document.getElementById("signup-password");
  if (password) password.value = "";
}

/**
 * Tras login/signup con sesión, el usuario aterriza en la HOME limpia (el
 * conversor), NO en el wizard de plantillas — iniciar sesión no debería
 * empujarte directo a "sube tu plantilla". El área Pro sigue a un clic
 * ("Mis plantillas" en el header, o los CTAs explícitos de subir plantilla,
 * que sí abren el studio a propósito vía showApp()/#app).
 */
function goToUserArea() {
  if (window.location.pathname === "/") {
    if (typeof window.showLanding === "function") window.showLanding();
  } else {
    window.location.href = "/";
  }
}

async function wireAuthUI(config) {
  initSupabase(config);

  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => {
      closeModal(el.dataset.close);
      if (el.dataset.switch) openModal(el.dataset.switch);
    });
  });

  const btnLogin = document.getElementById("btn-login");
  const btnSignup = document.getElementById("btn-signup");
  if (btnLogin) btnLogin.addEventListener("click", () => openModal("login-overlay"));
  if (btnSignup) btnSignup.addEventListener("click", () => openModal("signup-overlay"));

  const loginSubmit = document.getElementById("login-submit");
  if (loginSubmit) {
    loginSubmit.addEventListener("click", async () => {
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const errorEl = document.getElementById("login-error");
      errorEl.textContent = "";
      if (!supabaseClient) { errorEl.textContent = t("auth.notConfigured"); return; }
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) { errorEl.textContent = error.message; return; }
      closeModal("login-overlay");
      if (data.session) goToUserArea();
    });
  }

  const signupSubmit = document.getElementById("signup-submit");
  if (signupSubmit) {
    signupSubmit.addEventListener("click", async () => {
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      const errorEl = document.getElementById("signup-error");
      errorEl.textContent = "";
      if (!supabaseClient) { errorEl.textContent = t("auth.notConfigured"); return; }
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) { errorEl.textContent = error.message; return; }
      if (data.session) {
        closeModal("signup-overlay");
        goToUserArea();
        return;
      }
      // Sin sesión inmediata: el proyecto exige confirmar el email primero.
      showSignupCheckEmail();
    });
  }

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      if (supabaseClient) await supabaseClient.auth.signOut();
      if (window.location.pathname !== "/") window.location.href = "/";
      else if (typeof window.showLanding === "function") window.showLanding();
      refreshAuthUI(config);
    });
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(() => refreshAuthUI(config));
    await refreshAuthUI(config);
  }

  // Tras un redirect entre páginas post-login (ver goToUserArea), #app solo
  // puede comprobarse una vez la sesión terminó de cargar (arriba), no antes.
  if (window.location.hash === "#app" && state.session && typeof window.showApp === "function") {
    window.showApp();
  }
}

async function refreshAuthUI(config) {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  state.session = session;
  const loggedIn = Boolean(session);

  const userEmail = document.getElementById("user-email");
  const btnLogout = document.getElementById("btn-logout");
  const btnApp = document.getElementById("btn-app");
  const btnLogin = document.getElementById("btn-login");
  const btnSignup = document.getElementById("btn-signup");
  const badge = document.getElementById("tier-badge");

  if (userEmail) { userEmail.classList.toggle("hidden", !loggedIn); userEmail.textContent = loggedIn ? session.user.email : ""; }
  if (btnLogout) btnLogout.classList.toggle("hidden", !loggedIn);
  if (btnApp) btnApp.classList.toggle("hidden", !loggedIn);
  if (btnLogin) btnLogin.classList.toggle("hidden", loggedIn);
  if (btnSignup) btnSignup.classList.toggle("hidden", loggedIn);

  if (!loggedIn) {
    state.tier = null;
    if (badge) badge.classList.add("hidden");
    document.dispatchEvent(new CustomEvent("ai2w:auth", { detail: { loggedIn: false, tier: null } }));
    return;
  }

  try {
    const headers = await getAuthHeader();
    const resp = await fetch(`${config.API_BASE_URL}/api/me`, { headers });
    if (resp.ok) {
      const me = await resp.json();
      state.tier = me.tier;
      if (badge) { badge.textContent = me.tier; badge.classList.remove("hidden"); }
    }
  } catch (err) {
    if (badge) badge.classList.add("hidden");
  }
  document.dispatchEvent(new CustomEvent("ai2w:auth", { detail: { loggedIn: true, tier: state.tier } }));
}
