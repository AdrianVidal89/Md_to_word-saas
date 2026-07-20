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
      title: "Not sure how to get Markdown out of your AI?",
      subtitle: "Add this at the end of whatever you ask your AI — it'll reply in raw Markdown you can paste above. Some AIs already do this automatically.",
      promptLines: [
        "Give me your full answer formatted as raw Markdown —",
        "headings (#, ##), short paragraphs, bullet points and",
        "tables where useful, bold for key terms.",
        "",
        "Paste it inside a single code block, as plain text —",
        "do NOT render it. I need to copy the Markdown source",
        "itself, not the formatted preview.",
      ],
      note: "Tip: paste this right after whatever you're asking your AI — a report, notes, an essay, anything. Some AIs, like ChatGPT and Claude, often reply in raw Markdown automatically. Others, like Gemini, need this nudge — otherwise they'll render the formatted text instead of giving you the raw source.",
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
      googleBtn: "Continue with Google", orDivider: "or",
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
      trialNote: "Unlimited downloads with your own corporate template.",
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
        f1: "Unlimited conversions", f2: "No signup required", f3: "Clean generic template", f4: "Pass/Fail table coloring", f5: "1 free trial with a corporate template of your choice",
        cta: "Start converting" },
      pro: { name: "Pro", price: "€3.99", priceFree: "€0", period: "/ month", limitedTimeNote: "Free for a limited time", desc: "For a couple of coffees a month ☕ — for your own corporate template.",
        f1: "Persistent custom .dotx/.docx template", f2: "Automatic style mapping (with manual fallback)", f3: "Unlimited downloads with your own template", f4: "One-click image insertion in the editor",
        cta: "Upload your template", currentPlan: "Your current plan" },
      api: { name: "API", price: "Pay per use", period: "", desc: "For CI/CD pipelines and product integrations.",
        f1: "Machine-to-machine endpoint", f2: "Authenticated with an API key", f3: "No per-seat pricing", f4: "Built for automation",
        cta: "Talk to us" },
      faqTitle: "Questions",
      devLink: "Building a product or CI/CD pipeline? See API access →",
      faq1q: "Is the free plan really unlimited?", faq1a: "Yes, completely. We only apply light, invisible abuse protection behind the scenes — it never limits real usage.",
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
      title: "¿No sabes cómo sacarle Markdown a tu IA?",
      subtitle: "Añade esto al final de lo que le pidas a tu IA — te responderá en Markdown en bruto para pegar arriba. Algunas IAs ya lo hacen solas.",
      promptLines: [
        "Dame tu respuesta completa en formato Markdown en bruto —",
        "encabezados (#, ##), párrafos cortos, listas y tablas",
        "cuando ayuden, negrita para los términos clave.",
        "",
        "Pégalo dentro de un único bloque de código, como texto",
        "plano — NO lo renderices. Necesito copiar el propio",
        "código Markdown, no la vista previa formateada.",
      ],
      note: "Truco: pega esto justo después de lo que le pidas a tu IA — un informe, apuntes, un ensayo, lo que sea. Algunas IAs, como ChatGPT y Claude, suelen responder ya en Markdown en bruto. Otras, como Gemini, necesitan este empujón — si no, renderizarán el texto formateado en vez de darte el código fuente.",
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
      googleBtn: "Continuar con Google", orDivider: "o",
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
      trialNote: "Descargas ilimitadas con tu propia plantilla corporativa.",
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
        f1: "Conversiones ilimitadas", f2: "Sin registro", f3: "Plantilla genérica limpia", f4: "Coloreado Pass/Fail en tablas", f5: "1 prueba gratis con la plantilla corporativa que elijas",
        cta: "Empezar a convertir" },
      pro: { name: "Pro", price: "3,99€", priceFree: "0€", period: "/ mes", limitedTimeNote: "Gratis por tiempo limitado", desc: "Por unos cafés al mes ☕ — para tu propia plantilla corporativa.",
        f1: "Plantilla .dotx/.docx propia y persistente", f2: "Auto-mapeo de estilos (con fallback manual)", f3: "Descargas ilimitadas con tu propia plantilla", f4: "Inserta imágenes con un clic en el editor",
        cta: "Sube tu plantilla", currentPlan: "Tu plan actual" },
      api: { name: "API", price: "Por uso", period: "", desc: "Para pipelines de CI/CD e integraciones de producto.",
        f1: "Endpoint máquina a máquina", f2: "Autenticado con API key", f3: "Sin coste por asiento", f4: "Pensado para automatización",
        cta: "Hablemos" },
      faqTitle: "Preguntas frecuentes",
      devLink: "¿Construyes un producto o un pipeline de CI/CD? Mira el acceso API →",
      faq1q: "¿El plan free es de verdad ilimitado?", faq1a: "Sí, del todo. Solo aplicamos una protección ligera e invisible contra abusos — nunca limita el uso real.",
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
      title: "Vous ne savez pas comment obtenir du Markdown de votre IA ?",
      subtitle: "Ajoute ceci à la fin de ce que tu demandes à ton IA — elle répondra en Markdown brut à coller ci-dessus. Certaines IA le font déjà automatiquement.",
      promptLines: [
        "Donne-moi ta réponse complète en Markdown brut —",
        "titres (#, ##), paragraphes courts, listes et tableaux",
        "si utile, gras pour les termes clés.",
        "",
        "Colle-la dans un seul bloc de code, en texte brut —",
        "NE la rends PAS. J'ai besoin de copier le code Markdown",
        "lui-même, pas l'aperçu formaté.",
      ],
      note: "Astuce : colle ceci juste après ce que tu demandes à ton IA — un rapport, des notes, un essai, peu importe. Certaines IA, comme ChatGPT et Claude, répondent souvent déjà en Markdown brut. D'autres, comme Gemini, ont besoin de ce rappel — sinon elles afficheront le texte formaté au lieu de te donner le code source.",
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
      googleBtn: "Continuer avec Google", orDivider: "ou",
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
      trialNote: "Téléchargements illimités avec votre propre modèle d'entreprise.",
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
        f1: "Conversions illimitées", f2: "Sans inscription", f3: "Modèle générique propre", f4: "Coloration Pass/Fail dans les tableaux", f5: "1 essai gratuit avec le modèle d'entreprise de votre choix",
        cta: "Commencer à convertir" },
      pro: { name: "Pro", price: "3,99 €", priceFree: "0 €", period: "/ mois", limitedTimeNote: "Gratuit pour une durée limitée", desc: "Pour quelques cafés par mois ☕ — pour votre propre modèle d'entreprise.",
        f1: "Modèle .dotx/.docx personnel et persistant", f2: "Association automatique des styles (avec réglage manuel)", f3: "Téléchargements illimités avec votre propre modèle", f4: "Insertion d'images en un clic dans l'éditeur",
        cta: "Importez votre modèle", currentPlan: "Votre offre actuelle" },
      api: { name: "API", price: "Paiement à l'usage", period: "", desc: "Pour les pipelines CI/CD et les intégrations produit.",
        f1: "Endpoint machine à machine", f2: "Authentifié par clé API", f3: "Sans coût par utilisateur", f4: "Conçu pour l'automatisation",
        cta: "Contactez-nous" },
      faqTitle: "Questions",
      devLink: "Vous développez un produit ou un pipeline CI/CD ? Voir l'accès API →",
      faq1q: "Le plan gratuit est-il vraiment illimité ?", faq1a: "Oui, complètement. Nous appliquons seulement une protection légère et invisible contre les abus — cela ne limite jamais un usage réel.",
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
  pt: {
    warmup: { message: "A acordar o motor de conversão — o primeiro pedido pode demorar mais alguns segundos…" },
    nav: { home: "Início", pricing: "Preços", api: "API", login: "Entrar", signup: "Criar conta", logout: "Sair", myTemplates: "Os meus modelos" },
    hero: {
      eyebrow: "Grátis para sempre · Sem registo · Sem tags, sem JSON",
      title: "O seu modelo Word. Sem tags, sem JSON, sem código. Cole e descarregue.",
      subtitle: "Cole a resposta da sua IA abaixo e obtenha um documento Word limpo e formatado em segundos — grátis e ilimitado, sem conta.",
      templateLabel: "Modelo:",
      templateNone: "Modelo padrão",
      myTemplatesGroup: "Os meus modelos",
      titlePlaceholder: "Título do documento (opcional)",
      filenamePlaceholder: "nome-do-ficheiro",
      openFileBtn: "Abrir .md",
      editorPlaceholder: "# Cole aqui o seu Markdown...",
      editorTab: "Markdown",
      editorHint: "escreva, cole ou arraste um .md aqui",
      markdownGuideLink: "Guia de Markdown ↗",
      previewTab: "Pré-visualização",
      previewHint: "aproximada do resultado",
      downloadBtn: "Descarregar .docx",
      converting: "A converter…",
      downloaded: "Documento descarregado ✔",
      buildingTitle: "A gerar o seu documento…",
    },
    proBar: {
      bold: "Negrito", italic: "Itálico", heading: "Título",
      bulletList: "Lista com marcadores", numberedList: "Lista numerada",
      link: "Link", image: "Imagem (Pro)", code: "Código", table: "Tabela",
      togglePreview: "Mostrar/ocultar pré-visualização", help: "Ajuda de Markdown",
      linkPrompt: "URL do link:",
      imageTooLarge: "A imagem é demasiado grande (máx. 8 MB).",
      imageBadType: "Tipo de imagem não suportado — use PNG, JPEG, GIF, BMP ou TIFF.",
    },
    howitworks: {
      title: "Como funciona",
      step1: { title: "Cole", desc: "Cole a resposta que a sua IA lhe deu — Markdown, texto simples, tanto faz." },
      step2: { title: "Escolha um modelo", desc: "Use o modelo padrão, ou o seu próprio modelo corporativo com o Pro." },
      step3: { title: "Descarregue Word", desc: "Obtenha um .docx pronto a enviar em segundos. Sem tags, sem código." },
    },
    proToolbox: {
      title: "O seu espaço Pro",
      subtitle: "Tudo o que precisa, a um clique — sem promoções.",
      convertBtn: "Converter com o meu modelo",
      manageBtn: "Gerir os meus modelos",
      recentLabel: "Os seus modelos",
      empty: "Ainda não carregou nenhum modelo — comece no estúdio.",
    },
    compare: {
      title: "Já pronto a usar. Melhor ainda com a sua marca.",
      subtitle: "O resultado gratuito já é limpo. Carregue o seu modelo corporativo uma vez e cada futuro documento herda-o automaticamente.",
      genericLabel: "GENÉRICO (grátis)",
      customLabel: "COM O SEU MODELO",
      proBadge: "PRO",
      cta: "Carregue o seu modelo — 1 descarga grátis",
    },
    usecases: {
      title: "Feito para profissionais de qualquer setor",
      subtitle: "De um trabalho universitário a um relatório técnico no trabalho — se a sua IA o consegue escrever, nós convertemo-lo em Word.",
      case1: { title: "Trabalhos universitários", desc: "Transforme o ensaio ou capítulo de tese escrito pela sua IA num documento com o formato que o seu professor exige." },
      case2: { title: "Engenharia e especificações funcionais", desc: "Especificações e documentação técnica estruturada, com tabelas e títulos, prontas a partilhar com a sua equipa." },
      case3: { title: "QA / relatórios técnicos", desc: "Coloração automática Pass/Fail em cada tabela de resultados, diretamente a partir do seu Markdown." },
    },
    promptDemo: {
      title: "Não sabe como obter Markdown da sua IA?",
      subtitle: "Adicione isto no final do que pedir à sua IA — ela responderá em Markdown puro para colar acima. Algumas IAs já o fazem automaticamente.",
      promptLines: [
        "Dá-me a tua resposta completa formatada em Markdown puro —",
        "títulos (#, ##), parágrafos curtos, listas e tabelas",
        "quando úteis, negrito para os termos-chave.",
        "",
        "Cola-a dentro de um único bloco de código, como texto",
        "simples — NÃO a renderizes. Preciso de copiar o próprio",
        "código Markdown, não a pré-visualização formatada.",
      ],
      note: "Dica: cole isto logo a seguir ao que pedir à sua IA — um relatório, notas, um ensaio, o que for. Algumas IAs, como o ChatGPT e o Claude, costumam responder já em Markdown puro. Outras, como o Gemini, precisam deste empurrão — caso contrário vão renderizar o texto formatado em vez de lhe dar a fonte em bruto.",
      copyBtn: "Copiar prompt",
      copiedBtn: "Copiado ✔",
    },
    apiTeaser: {
      title: "Integre-o no seu próprio produto",
      desc: "Um endpoint máquina a máquina autenticado com uma chave de API. Para pipelines de CI/CD ou o seu próprio SaaS.",
      cta: "Ver documentação da API",
    },
    footer: { tagline: "AI to Word — cole a resposta da sua IA, descarregue Word. Sem tags, sem JSON, sem código." },
    auth: {
      loginTitle: "Entrar", signupTitle: "Criar conta",
      emailPlaceholder: "Email", passwordPlaceholder: "Palavra-passe", passwordPlaceholderMin: "Palavra-passe (mín. 6 caracteres)",
      loginSubmit: "Entrar", signupSubmit: "Criar conta",
      switchToSignup: "Não tem conta? Registe-se", switchToLogin: "Já tem conta? Entre",
      notConfigured: "O Supabase ainda não está configurado.",
      googleBtn: "Continuar com o Google", orDivider: "ou",
      checkEmailTitle: "Verifique o seu email",
      checkEmailDesc: "Enviámos um link de confirmação para o seu email. Confirme-o e depois inicie sessão.",
      closeBtn: "Fechar",
    },
    wizard: {
      title: "O seu modelo corporativo",
      backToLanding: "← Voltar ao início",
      myTemplatesTitle: "Os seus modelos",
      noTemplates: "Ainda não carregou nenhum modelo.",
      newTemplateBtn: "Carregar um novo modelo",
      useBtn: "Usar este modelo",
      editBtn: "Editar",
      deleteBtn: "Eliminar",
      studioLabel: "Estúdio de modelos",
      tocGuideTitle: "Dica: atualize os campos depois de abrir o ficheiro",
      tocGuideDesc: "Se o seu modelo incluir um índice ou outros campos do Word, o Word não os atualiza automaticamente. Clique com o botão direito sobre ele e escolha “Atualizar campo” (ou prima F9) depois de abrir o seu documento.",
      tocGuideMenuItem: "Atualizar campo",
      stepUpload: "Carregar",
      stepMap: "Associar estilos",
      stepConvert: "Converter",
      step1Title: "Passo 1 — Carregue o seu .dotx/.docx",
      step1Desc: "Guardamo-lo tal como está, nada é modificado.",
      nameLabel: "Nome do modelo",
      uploadBtn: "Carregar",
      chooseFile: "Escolha primeiro um ficheiro .docx/.dotx.",
      step2Title: "Passo 2 — Associação de estilos",
      step2Desc: "Tentámos detetar os seus estilos automaticamente. Ajuste o que estiver errado ou em falta — há sempre uma opção manual.",
      mappingHeading1: "Estilo para Título 1",
      mappingHeading2: "Estilo para Título 2",
      mappingHeading3: "Estilo para Título 3",
      mappingTable: "Estilo de tabela",
      notDetected: "— não detetado, escolha um —",
      saveMappingBtn: "Guardar associação e continuar",
      step3Title: "Passo 3 — Conversão de teste",
      step3Desc: "Cole algum Markdown e gere um .docx real com o seu modelo.",
      convertBtn: "Converter com o meu modelo",
      trialNote: "Descargas ilimitadas com o seu próprio modelo corporativo.",
      trialUsedTitle: "Já usou a sua avaliação gratuita",
      upgradeMessage: "Passe a Pro para descargas ilimitadas com o seu próprio modelo.",
      upgradeCta: "Passar a Pro",
      convertedOk: "Documento descarregado — esta foi a sua descarga de avaliação gratuita.",
      convertedOkPro: "Documento descarregado ✔",
    },
    pricing: {
      title: "Preços simples",
      subtitle: "Comece grátis. Só suba de plano quando precisar do seu próprio modelo.",
      free: { name: "Grátis", price: "0 €", period: "para sempre", desc: "O isco — melhor do que os outros conversores gratuitos por aí.",
        f1: "Conversões ilimitadas", f2: "Sem registo necessário", f3: "Modelo genérico limpo", f4: "Coloração Pass/Fail em tabelas", f5: "1 avaliação grátis com o modelo corporativo à sua escolha",
        cta: "Começar a converter" },
      pro: { name: "Pro", price: "3,99 €", priceFree: "0 €", period: "/ mês", limitedTimeNote: "Grátis por tempo limitado", desc: "Por uns cafés por mês ☕ — para o seu próprio modelo corporativo.",
        f1: "Modelo .dotx/.docx próprio e persistente", f2: "Associação automática de estilos (com opção manual)", f3: "Descargas ilimitadas com o seu próprio modelo", f4: "Inserção de imagens com um clique no editor",
        cta: "Carregue o seu modelo", currentPlan: "O seu plano atual" },
      api: { name: "API", price: "Pagamento por uso", period: "", desc: "Para pipelines de CI/CD e integrações de produto.",
        f1: "Endpoint máquina a máquina", f2: "Autenticado com chave de API", f3: "Sem custo por utilizador", f4: "Pensado para automação",
        cta: "Fale connosco" },
      faqTitle: "Perguntas frequentes",
      devLink: "A construir um produto ou pipeline de CI/CD? Veja o acesso à API →",
      faq1q: "O plano gratuito é mesmo ilimitado?", faq1a: "Sim, totalmente. Aplicamos apenas uma proteção ligeira e invisível contra abusos — nunca limita o uso real.",
      faq2q: "O que acontece depois da minha 1 descarga Pro grátis?", faq2a: "Verá um aviso claro para subir de plano — nunca uma pré-visualização desfocada ou falsa. A primeira descarga é sempre o ficheiro real e completo.",
      faq3q: "Posso cancelar a qualquer momento?", faq3a: "Sim. O Pro é faturado mensalmente, cancele quando quiser — sem fidelização.",
    },
    api: {
      title: "Integre a geração de documentos no seu produto",
      subtitle: "Um único endpoint autenticado que transforma Markdown em .docx. Sem SDK necessário — HTTP simples.",
      authTitle: "Autenticação",
      authDesc: "Cada pedido precisa de um cabeçalho X-API-Key. As chaves são emitidas por conta e nunca são guardadas em texto simples do nosso lado.",
      endpointTitle: "Endpoint",
      requestTitle: "Exemplo de pedido",
      responseTitle: "Resposta",
      responseDesc: "Um ficheiro .docx binário (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document), pronto a guardar ou a servir aos seus utilizadores.",
      paramsTitle: "Campos do formulário",
      paramMarkdown: "a fonte Markdown (obrigatório)",
      paramTemplate: "ID do modelo do catálogo, ou omitir para o modelo padrão",
      paramTitle: "título do documento (usado se ainda não estiver no frontmatter)",
      paramAuthor: "autor do documento (usado se ainda não estiver no frontmatter)",
      paramFilename: "nome do ficheiro de saída, sem extensão",
      pricingTitle: "Preços da API",
      pricingPlan: "API B2B",
      pricingPrice: "19,00 €",
      pricingPeriod: "/ mês",
      pricingOverage: "+ 0,05 € por conversão acima da sua quota mensal",
      pricingF1: "Endpoint servidor a servidor (X-API-Key)",
      pricingF2: "Para integradores de software terceiros",
      pricingF3: "Sem custo por utilizador",
      pricingF4: "Faturação por uso, cancele quando quiser",
      ctaTitle: "Quer acesso?",
      ctaDesc: "Conte-nos o seu caso de uso e nós damos-lhe uma chave.",
      cta: "Pedir acesso à API",
    },
  },
  de: {
    warmup: { message: "Die Konvertierungs-Engine wird gestartet — die erste Anfrage kann ein paar Sekunden länger dauern…" },
    nav: { home: "Start", pricing: "Preise", api: "API", login: "Anmelden", signup: "Registrieren", logout: "Abmelden", myTemplates: "Meine Vorlagen" },
    hero: {
      eyebrow: "Für immer kostenlos · Keine Registrierung · Keine Tags, kein JSON",
      title: "Ihre Word-Vorlage. Keine Tags, kein JSON, kein Code. Einfügen und herunterladen.",
      subtitle: "Fügen Sie unten die Antwort Ihrer KI ein und erhalten Sie in Sekunden ein sauberes, formatiertes Word-Dokument — kostenlos und unbegrenzt, ohne Konto.",
      templateLabel: "Vorlage:",
      templateNone: "Standardvorlage",
      myTemplatesGroup: "Meine Vorlagen",
      titlePlaceholder: "Dokumenttitel (optional)",
      filenamePlaceholder: "dateiname",
      openFileBtn: ".md öffnen",
      editorPlaceholder: "# Fügen Sie hier Ihr Markdown ein...",
      editorTab: "Markdown",
      editorHint: "hier .md schreiben, einfügen oder ablegen",
      markdownGuideLink: "Markdown-Leitfaden ↗",
      previewTab: "Vorschau",
      previewHint: "annähernd wie das Ergebnis",
      downloadBtn: ".docx herunterladen",
      converting: "Wird konvertiert…",
      downloaded: "Dokument heruntergeladen ✔",
      buildingTitle: "Ihr Dokument wird erstellt…",
    },
    proBar: {
      bold: "Fett", italic: "Kursiv", heading: "Überschrift",
      bulletList: "Aufzählungsliste", numberedList: "Nummerierte Liste",
      link: "Link", image: "Bild (Pro)", code: "Code", table: "Tabelle",
      togglePreview: "Vorschau ein-/ausblenden", help: "Markdown-Hilfe",
      linkPrompt: "Link-URL:",
      imageTooLarge: "Das Bild ist zu groß (max. 8 MB).",
      imageBadType: "Nicht unterstützter Bildtyp — verwenden Sie PNG, JPEG, GIF, BMP oder TIFF.",
    },
    howitworks: {
      title: "So funktioniert's",
      step1: { title: "Einfügen", desc: "Fügen Sie die Antwort Ihrer KI ein — Markdown, Klartext, egal was." },
      step2: { title: "Vorlage wählen", desc: "Nutzen Sie die Standardvorlage oder mit Pro Ihre eigene Unternehmensvorlage." },
      step3: { title: "Word herunterladen", desc: "Erhalten Sie in Sekunden ein versandfertiges .docx. Keine Tags, kein Code." },
    },
    proToolbox: {
      title: "Ihr Pro-Bereich",
      subtitle: "Alles, was Sie brauchen, einen Klick entfernt — ohne Verkaufsdruck.",
      convertBtn: "Mit meiner Vorlage konvertieren",
      manageBtn: "Meine Vorlagen verwalten",
      recentLabel: "Ihre Vorlagen",
      empty: "Sie haben noch keine Vorlage hochgeladen — starten Sie im Studio.",
    },
    compare: {
      title: "So schon einsatzbereit. Noch besser mit Ihrer eigenen Marke.",
      subtitle: "Das kostenlose Ergebnis sieht schon sauber aus. Laden Sie Ihre Unternehmensvorlage einmal hoch, und jedes künftige Dokument übernimmt sie automatisch.",
      genericLabel: "GENERISCH (kostenlos)",
      customLabel: "MIT IHRER VORLAGE",
      proBadge: "PRO",
      cta: "Vorlage hochladen — 1 kostenloser Download",
    },
    usecases: {
      title: "Gemacht für Profis in jeder Branche",
      subtitle: "Von einer Studienarbeit bis zum technischen Bericht bei der Arbeit — wenn Ihre KI es schreiben kann, wandeln wir es in Word um.",
      case1: { title: "Studienarbeiten", desc: "Verwandeln Sie den von Ihrer KI verfassten Aufsatz oder das Abschlussarbeitskapitel in ein Dokument im von Ihrem Dozenten geforderten Format." },
      case2: { title: "Technik & Fachspezifikationen", desc: "Strukturierte Spezifikationen und technische Dokumentation mit Tabellen und Überschriften, bereit zum Teilen mit Ihrem Team." },
      case3: { title: "QA / technische Berichte", desc: "Automatische Pass/Fail-Einfärbung in jeder Ergebnistabelle, direkt aus Ihrem Markdown." },
    },
    promptDemo: {
      title: "Sie wissen nicht, wie Sie Markdown aus Ihrer KI herausbekommen?",
      subtitle: "Fügen Sie dies an das Ende Ihrer Anfrage an die KI an — sie antwortet mit rohem Markdown, das Sie oben einfügen können. Manche KIs tun das schon automatisch.",
      promptLines: [
        "Gib mir deine vollständige Antwort als reines Markdown —",
        "Überschriften (#, ##), kurze Absätze, Aufzählungen und",
        "Tabellen wo sinnvoll, fett für Schlüsselbegriffe.",
        "",
        "Füge es in einen einzigen Codeblock ein, als reinen Text —",
        "rendere es NICHT. Ich brauche den Markdown-Quelltext",
        "selbst, nicht die formatierte Vorschau.",
      ],
      note: "Tipp: Fügen Sie dies direkt nach dem ein, was Sie Ihre KI fragen — einen Bericht, Notizen, einen Aufsatz, alles. Manche KIs, wie ChatGPT und Claude, antworten oft schon automatisch mit rohem Markdown. Andere, wie Gemini, brauchen diesen Hinweis — sonst rendern sie den formatierten Text, statt Ihnen den Rohquelltext zu geben.",
      copyBtn: "Prompt kopieren",
      copiedBtn: "Kopiert ✔",
    },
    apiTeaser: {
      title: "In Ihr eigenes Produkt integrieren",
      desc: "Ein Machine-to-Machine-Endpunkt, authentifiziert mit einem API-Schlüssel. Für CI/CD-Pipelines oder Ihr eigenes SaaS.",
      cta: "API-Dokumentation ansehen",
    },
    footer: { tagline: "AI to Word — fügen Sie die Antwort Ihrer KI ein, laden Sie Word herunter. Keine Tags, kein JSON, kein Code." },
    auth: {
      loginTitle: "Anmelden", signupTitle: "Konto erstellen",
      emailPlaceholder: "E-Mail", passwordPlaceholder: "Passwort", passwordPlaceholderMin: "Passwort (mind. 6 Zeichen)",
      loginSubmit: "Anmelden", signupSubmit: "Konto erstellen",
      switchToSignup: "Kein Konto? Registrieren", switchToLogin: "Schon ein Konto? Anmelden",
      notConfigured: "Supabase ist noch nicht konfiguriert.",
      googleBtn: "Mit Google fortfahren", orDivider: "oder",
      checkEmailTitle: "Prüfen Sie Ihr Postfach",
      checkEmailDesc: "Wir haben einen Bestätigungslink an Ihre E-Mail gesendet. Bestätigen Sie ihn und melden Sie sich dann an.",
      closeBtn: "Schließen",
    },
    wizard: {
      title: "Ihre Unternehmensvorlage",
      backToLanding: "← Zurück zur Startseite",
      myTemplatesTitle: "Ihre Vorlagen",
      noTemplates: "Sie haben noch keine Vorlage hochgeladen.",
      newTemplateBtn: "Neue Vorlage hochladen",
      useBtn: "Diese Vorlage verwenden",
      editBtn: "Bearbeiten",
      deleteBtn: "Löschen",
      studioLabel: "Vorlagen-Studio",
      tocGuideTitle: "Tipp: Felder nach dem Öffnen der Datei aktualisieren",
      tocGuideDesc: "Wenn Ihre Vorlage ein Inhaltsverzeichnis oder andere Word-Felder enthält, aktualisiert Word sie nicht automatisch. Klicken Sie mit der rechten Maustaste darauf und wählen Sie „Feld aktualisieren“ (oder drücken Sie F9), nachdem Sie Ihr Dokument geöffnet haben.",
      tocGuideMenuItem: "Feld aktualisieren",
      stepUpload: "Hochladen",
      stepMap: "Stile zuordnen",
      stepConvert: "Konvertieren",
      step1Title: "Schritt 1 — Laden Sie Ihre .dotx/.docx hoch",
      step1Desc: "Wir speichern sie unverändert, es wird nichts angepasst.",
      nameLabel: "Vorlagenname",
      uploadBtn: "Hochladen",
      chooseFile: "Wählen Sie zuerst eine .docx/.dotx-Datei aus.",
      step2Title: "Schritt 2 — Stilzuordnung",
      step2Desc: "Wir haben versucht, Ihre Stile automatisch zu erkennen. Passen Sie an, was falsch oder fehlend ist — eine manuelle Auswahl ist immer möglich.",
      mappingHeading1: "Stil für Überschrift 1",
      mappingHeading2: "Stil für Überschrift 2",
      mappingHeading3: "Stil für Überschrift 3",
      mappingTable: "Tabellenstil",
      notDetected: "— nicht erkannt, wählen Sie einen —",
      saveMappingBtn: "Zuordnung speichern & weiter",
      step3Title: "Schritt 3 — Testkonvertierung",
      step3Desc: "Fügen Sie etwas Markdown ein und erstellen Sie ein echtes .docx mit Ihrer Vorlage.",
      convertBtn: "Mit meiner Vorlage konvertieren",
      trialNote: "Unbegrenzte Downloads mit Ihrer eigenen Unternehmensvorlage.",
      trialUsedTitle: "Sie haben Ihren kostenlosen Test bereits genutzt",
      upgradeMessage: "Wechseln Sie zu Pro für unbegrenzte Downloads mit Ihrer eigenen Vorlage.",
      upgradeCta: "Auf Pro upgraden",
      convertedOk: "Dokument heruntergeladen — das war Ihr kostenloser Testdownload.",
      convertedOkPro: "Dokument heruntergeladen ✔",
    },
    pricing: {
      title: "Einfache Preise",
      subtitle: "Kostenlos starten. Upgraden Sie nur, wenn Sie Ihre eigene Vorlage brauchen.",
      free: { name: "Kostenlos", price: "0 €", period: "für immer", desc: "Der Türöffner — besser als die anderen kostenlosen Konverter da draußen.",
        f1: "Unbegrenzte Konvertierungen", f2: "Keine Registrierung nötig", f3: "Saubere generische Vorlage", f4: "Pass/Fail-Einfärbung in Tabellen", f5: "1 kostenloser Test mit einer Unternehmensvorlage Ihrer Wahl",
        cta: "Jetzt konvertieren" },
      pro: { name: "Pro", price: "3,99 €", priceFree: "0 €", period: "/ Monat", limitedTimeNote: "Kostenlos für begrenzte Zeit", desc: "Für ein paar Kaffees im Monat ☕ — für Ihre eigene Unternehmensvorlage.",
        f1: "Persistente eigene .dotx/.docx-Vorlage", f2: "Automatische Stilzuordnung (mit manueller Option)", f3: "Unbegrenzte Downloads mit Ihrer eigenen Vorlage", f4: "Bildeinfügung mit einem Klick im Editor",
        cta: "Vorlage hochladen", currentPlan: "Ihr aktueller Plan" },
      api: { name: "API", price: "Nutzungsbasiert", period: "", desc: "Für CI/CD-Pipelines und Produktintegrationen.",
        f1: "Machine-to-Machine-Endpunkt", f2: "Authentifiziert mit API-Schlüssel", f3: "Keine Kosten pro Sitzplatz", f4: "Für Automatisierung konzipiert",
        cta: "Sprechen Sie mit uns" },
      faqTitle: "Fragen",
      devLink: "Sie entwickeln ein Produkt oder eine CI/CD-Pipeline? Siehe API-Zugang →",
      faq1q: "Ist der kostenlose Plan wirklich unbegrenzt?", faq1a: "Ja, vollständig. Wir wenden im Hintergrund nur einen leichten, unsichtbaren Missbrauchsschutz an — er schränkt echte Nutzung nie ein.",
      faq2q: "Was passiert nach meinem 1 kostenlosen Pro-Download?", faq2a: "Sie sehen einen klaren Upgrade-Hinweis — nie eine verschwommene oder gefälschte Vorschau. Der erste Download ist immer die echte, vollständige Datei.",
      faq3q: "Kann ich jederzeit kündigen?", faq3a: "Ja. Pro wird monatlich abgerechnet, kündigen Sie jederzeit — keine Vertragsbindung.",
    },
    api: {
      title: "Integrieren Sie die Dokumentgenerierung in Ihr Produkt",
      subtitle: "Ein einziger authentifizierter Endpunkt, der Markdown in .docx umwandelt. Kein SDK nötig — reines HTTP.",
      authTitle: "Authentifizierung",
      authDesc: "Jede Anfrage benötigt einen X-API-Key-Header. Schlüssel werden pro Konto ausgestellt und bei uns niemals im Klartext gespeichert.",
      endpointTitle: "Endpunkt",
      requestTitle: "Beispielanfrage",
      responseTitle: "Antwort",
      responseDesc: "Eine binäre .docx-Datei (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document), bereit zum Speichern oder Ausliefern an Ihre Nutzer.",
      paramsTitle: "Formularfelder",
      paramMarkdown: "die Markdown-Quelle (erforderlich)",
      paramTemplate: "Katalog-Vorlagen-ID, oder weglassen für die Standardvorlage",
      paramTitle: "Dokumenttitel (verwendet, falls noch nicht im Frontmatter vorhanden)",
      paramAuthor: "Dokumentautor (verwendet, falls noch nicht im Frontmatter vorhanden)",
      paramFilename: "Ausgabedateiname, ohne Erweiterung",
      pricingTitle: "API-Preise",
      pricingPlan: "API B2B",
      pricingPrice: "19,00 €",
      pricingPeriod: "/ Monat",
      pricingOverage: "+ 0,05 € pro Konvertierung über Ihr monatliches Kontingent hinaus",
      pricingF1: "Server-zu-Server-Endpunkt (X-API-Key)",
      pricingF2: "Für Drittanbieter-Softwareintegratoren",
      pricingF3: "Keine Kosten pro Sitzplatz",
      pricingF4: "Nutzungsbasierte Abrechnung, jederzeit kündbar",
      ctaTitle: "Zugang gewünscht?",
      ctaDesc: "Erzählen Sie uns von Ihrem Anwendungsfall, und wir richten Ihnen einen Schlüssel ein.",
      cta: "API-Zugang anfordern",
    },
  },
  zh: {
    warmup: { message: "正在唤醒转换引擎——第一次请求可能需要多几秒钟…" },
    nav: { home: "首页", pricing: "价格", api: "API", login: "登录", signup: "注册", logout: "退出登录", myTemplates: "我的模板" },
    hero: {
      eyebrow: "永久免费 · 无需注册 · 无标签，无 JSON",
      title: "你的 Word 模板。无标签，无 JSON，无代码。粘贴即可下载。",
      subtitle: "在下方粘贴你的 AI 生成的回答，几秒钟内即可获得一份干净、排版整齐的 Word 文档——免费且无限制，无需注册账号。",
      templateLabel: "模板：",
      templateNone: "默认简洁模板",
      myTemplatesGroup: "我的模板",
      titlePlaceholder: "文档标题（可选）",
      filenamePlaceholder: "文件名",
      openFileBtn: "打开 .md",
      editorPlaceholder: "# 在此粘贴你的 Markdown...",
      editorTab: "Markdown",
      editorHint: "在此输入、粘贴或拖放 .md 文件",
      markdownGuideLink: "Markdown 指南 ↗",
      previewTab: "预览",
      previewHint: "效果与最终结果接近",
      downloadBtn: "下载 .docx",
      converting: "转换中…",
      downloaded: "文档已下载 ✔",
      buildingTitle: "正在生成你的文档…",
    },
    proBar: {
      bold: "加粗", italic: "斜体", heading: "标题",
      bulletList: "项目符号列表", numberedList: "编号列表",
      link: "链接", image: "图片（专业版）", code: "代码", table: "表格",
      togglePreview: "显示/隐藏预览", help: "Markdown 帮助",
      linkPrompt: "链接网址：",
      imageTooLarge: "图片过大（最大 8 MB）。",
      imageBadType: "不支持的图片格式——请使用 PNG、JPEG、GIF、BMP 或 TIFF。",
    },
    howitworks: {
      title: "使用方法",
      step1: { title: "粘贴", desc: "粘贴 AI 给你的回答——Markdown、纯文本，什么都可以。" },
      step2: { title: "选择模板", desc: "使用默认简洁模板，或在专业版中使用你自己的企业模板。" },
      step3: { title: "下载 Word", desc: "几秒钟内获得可直接发送的 .docx 文件。无标签，无代码。" },
    },
    proToolbox: {
      title: "你的专业版空间",
      subtitle: "所需的一切，一键直达——绝不推销。",
      convertBtn: "使用我的模板转换",
      manageBtn: "管理我的模板",
      recentLabel: "你的模板",
      empty: "你还没有上传任何模板——在工作室里开始吧。",
    },
    compare: {
      title: "开箱即用，配上你自己的品牌更出色。",
      subtitle: "免费版的输出已经很干净了。上传一次你的企业模板，以后每份文档都会自动继承它。",
      genericLabel: "通用（免费）",
      customLabel: "使用你的模板",
      proBadge: "专业版",
      cta: "上传你的模板 — 1 次免费下载",
    },
    usecases: {
      title: "为各行各业的专业人士打造",
      subtitle: "从大学作业到工作中的技术报告——只要你的 AI 能写出来，我们就能把它转换成 Word。",
      case1: { title: "大学作业", desc: "把 AI 起草的论文或毕业论文章节，转换成符合老师要求格式的文档。" },
      case2: { title: "工程与功能规格说明", desc: "结构化的规格说明与技术文档，配有表格和标题，随时可与团队分享。" },
      case3: { title: "QA / 技术报告", desc: "直接从你的 Markdown 自动为每个结果表格上色，标记 Pass/Fail。" },
    },
    promptDemo: {
      title: "不知道怎么让 AI 输出 Markdown？",
      subtitle: "把这段话加在你向 AI 提问的末尾——它就会用原始 Markdown 回复，你可以直接粘贴到上面。有些 AI 已经会自动这样做了。",
      promptLines: [
        "请将你的完整回答格式化为原始 Markdown——",
        "标题（#、##）、简短段落、要点列表，",
        "有用时加上表格，关键术语用加粗标注。",
        "",
        "请把它放在一个代码块里，以纯文本形式给出——",
        "不要渲染它。我需要复制 Markdown 源码本身，",
        "而不是格式化后的预览效果。",
      ],
      note: "提示：把这段话紧跟在你向 AI 提出的任何请求之后——报告、笔记、文章，什么都行。有些 AI（比如 ChatGPT 和 Claude）通常已经会自动用原始 Markdown 回复。而像 Gemini 这样的 AI 则需要这个提示，否则它会渲染格式化文本，而不是给你原始源码。",
      copyBtn: "复制提示词",
      copiedBtn: "已复制 ✔",
    },
    apiTeaser: {
      title: "集成到你自己的产品中",
      desc: "一个使用 API 密钥认证的机器对机器接口。可接入 CI/CD 流水线或你自己的 SaaS 产品。",
      cta: "查看 API 文档",
    },
    footer: { tagline: "AI to Word——粘贴你的 AI 回答，下载 Word 文档。无标签，无 JSON，无代码。" },
    auth: {
      loginTitle: "登录", signupTitle: "创建账号",
      emailPlaceholder: "邮箱", passwordPlaceholder: "密码", passwordPlaceholderMin: "密码（至少 6 个字符）",
      loginSubmit: "登录", signupSubmit: "创建账号",
      switchToSignup: "还没有账号？注册", switchToLogin: "已有账号？登录",
      notConfigured: "Supabase 尚未配置。",
      googleBtn: "使用 Google 继续", orDivider: "或",
      checkEmailTitle: "请查收你的邮箱",
      checkEmailDesc: "我们已向你的邮箱发送了确认链接。请确认后再登录。",
      closeBtn: "关闭",
    },
    wizard: {
      title: "你的企业模板",
      backToLanding: "← 返回首页",
      myTemplatesTitle: "你的模板",
      noTemplates: "你还没有上传任何模板。",
      newTemplateBtn: "上传新模板",
      useBtn: "使用此模板",
      editBtn: "编辑",
      deleteBtn: "删除",
      studioLabel: "模板工作室",
      tocGuideTitle: "提示：打开文件后请刷新字段",
      tocGuideDesc: "如果你的模板包含目录或其他 Word 域字段，Word 不会自动更新它们。打开文档后，请右键点击该字段并选择“更新域”（或按 F9）。",
      tocGuideMenuItem: "更新域",
      stepUpload: "上传",
      stepMap: "样式映射",
      stepConvert: "转换",
      step1Title: "第 1 步 — 上传你的 .dotx/.docx",
      step1Desc: "我们会原样保存，不做任何修改。",
      nameLabel: "模板名称",
      uploadBtn: "上传",
      chooseFile: "请先选择一个 .docx/.dotx 文件。",
      step2Title: "第 2 步 — 样式映射",
      step2Desc: "我们尝试自动检测你的样式。请调整任何错误或缺失的部分——始终提供手动选择作为备选方案。",
      mappingHeading1: "标题 1 样式",
      mappingHeading2: "标题 2 样式",
      mappingHeading3: "标题 3 样式",
      mappingTable: "表格样式",
      notDetected: "— 未检测到，请选择一个 —",
      saveMappingBtn: "保存映射并继续",
      step3Title: "第 3 步 — 测试转换",
      step3Desc: "粘贴一些 Markdown，用你的模板生成一份真实的 .docx 文件。",
      convertBtn: "使用我的模板转换",
      trialNote: "使用你自己的企业模板，无限次下载。",
      trialUsedTitle: "你已经使用过免费试用",
      upgradeMessage: "升级到专业版，使用你自己的模板无限次下载。",
      upgradeCta: "升级到专业版",
      convertedOk: "文档已下载——这是你的免费试用下载。",
      convertedOkPro: "文档已下载 ✔",
    },
    pricing: {
      title: "简单透明的价格",
      subtitle: "免费开始使用。只有在需要自己的模板时才需要升级。",
      free: { name: "免费版", price: "€0", period: "永久", desc: "引流利器——比市面上其他免费转换工具更好用。",
        f1: "无限次转换", f2: "无需注册", f3: "简洁的通用模板", f4: "表格中的 Pass/Fail 自动上色", f5: "1 次免费试用，可使用你选择的企业模板",
        cta: "开始转换" },
      pro: { name: "专业版", price: "€3.99", priceFree: "€0", period: "/ 月", limitedTimeNote: "限时免费", desc: "每月几杯咖啡的价格 ☕——用来使用你自己的企业模板。",
        f1: "持久保存的自定义 .dotx/.docx 模板", f2: "自动样式映射（带手动备选方案）", f3: "使用你自己的模板无限次下载", f4: "在编辑器中一键插入图片",
        cta: "上传你的模板", currentPlan: "你当前的方案" },
      api: { name: "API", price: "按使用量付费", period: "", desc: "适用于 CI/CD 流水线和产品集成。",
        f1: "机器对机器接口", f2: "使用 API 密钥认证", f3: "不按席位收费", f4: "专为自动化设计",
        cta: "联系我们" },
      faqTitle: "常见问题",
      devLink: "正在构建产品或 CI/CD 流水线？查看 API 访问 →",
      faq1q: "免费版真的是无限制的吗？", faq1a: "是的，完全无限制。我们只在后台做了轻量、不可见的防滥用保护——绝不会限制真实使用。",
      faq2q: "免费的 1 次专业版下载用完之后会怎样？", faq2a: "你会看到一个清晰的升级提示——绝不会是模糊或虚假的预览。第一次下载始终是真实、完整的文件。",
      faq3q: "我可以随时取消吗？", faq3a: "可以。专业版按月计费，随时可以取消——没有长期合约限制。",
    },
    api: {
      title: "将文档生成功能集成到你的产品中",
      subtitle: "一个经过认证的接口，即可将 Markdown 转换为 .docx。无需 SDK——纯 HTTP 请求。",
      authTitle: "身份认证",
      authDesc: "每个请求都需要一个 X-API-Key 请求头。密钥按账号签发，我们绝不会以明文形式存储。",
      endpointTitle: "接口地址",
      requestTitle: "请求示例",
      responseTitle: "响应",
      responseDesc: "一个二进制 .docx 文件（Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document），可直接保存或提供给你的用户。",
      paramsTitle: "表单字段",
      paramMarkdown: "Markdown 源内容（必填）",
      paramTemplate: "目录中的模板 ID，留空则使用默认简洁模板",
      paramTitle: "文档标题（若 frontmatter 中尚未包含则使用此项）",
      paramAuthor: "文档作者（若 frontmatter 中尚未包含则使用此项）",
      paramFilename: "输出文件名，不含扩展名",
      pricingTitle: "API 价格",
      pricingPlan: "API B2B",
      pricingPrice: "€19.00",
      pricingPeriod: "/ 月",
      pricingOverage: "超出每月配额后，每次转换额外收取 €0.05",
      pricingF1: "服务器对服务器接口（X-API-Key）",
      pricingF2: "面向第三方软件集成商",
      pricingF3: "不按席位收费",
      pricingF4: "按使用量计费，随时可取消",
      ctaTitle: "想要获取访问权限？",
      ctaDesc: "告诉我们你的使用场景，我们会为你开通密钥。",
      cta: "申请 API 访问权限",
    },
  },
};

const LANGS = ["en", "es", "fr", "pt", "de", "zh"];

const state = {
  lang: LANGS.includes(localStorage.getItem("formalize_lang")) ? localStorage.getItem("formalize_lang") : "en",
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

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const select = document.getElementById("lang-select");
  if (select) select.value = state.lang;
}

function initLangToggle(onChange) {
  const select = document.getElementById("lang-select");
  if (!select) return;
  select.value = state.lang;
  select.addEventListener("change", () => {
    state.lang = select.value;
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

  // Login/registro con Google (OAuth vía Supabase). Un solo flujo sirve para
  // ambos: si la cuenta no existe, Supabase la crea al vuelo. signInWithOAuth
  // redirige a Google y vuelve a `redirectTo`; al volver, onAuthStateChange
  // (abajo) refresca la UI ya con sesión. Requiere tener el provider Google
  // habilitado en el panel de Supabase (ver notas de despliegue).
  async function startGoogleOAuth(errorElId) {
    const errorEl = document.getElementById(errorElId);
    if (errorEl) errorEl.textContent = "";
    if (!supabaseClient) { if (errorEl) errorEl.textContent = t("auth.notConfigured"); return; }
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/" },
    });
    if (error && errorEl) errorEl.textContent = error.message;
  }
  const googleLoginBtn = document.getElementById("google-login-btn");
  const googleSignupBtn = document.getElementById("google-signup-btn");
  if (googleLoginBtn) googleLoginBtn.addEventListener("click", () => startGoogleOAuth("login-error"));
  if (googleSignupBtn) googleSignupBtn.addEventListener("click", () => startGoogleOAuth("signup-error"));

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
