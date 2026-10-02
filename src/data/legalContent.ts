export type LegalLanguage =
  | "en"
  | "fr"
  | "ar";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function getLegalLanguage(
  language?: string,
): LegalLanguage {
  const code =
    language?.split("-")[0];

  if (code === "fr") {
    return "fr";
  }

  if (code === "ar") {
    return "ar";
  }

  return "en";
}

export const privacyContent: Record<
  LegalLanguage,
  LegalDocument
> = {
  en: {
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains how Alf Sahten handles information when you use the platform.",
    lastUpdated:
      "Last updated: October 2, 2026",
    sections: [
      {
        title: "1. Information you provide",
        paragraphs: [
          "When you create or use an Alf Sahten account, you may provide information such as your email address, profile details and language preferences.",
          "If you apply to become a Cook, you may provide additional information for your application and public Cook profile.",
          "When you publish recipes or services, you may provide titles, descriptions, ingredients, instructions, photos and other content.",
          "Features such as My Kitchen, Saved Recipes and following Cooks may store information about the ingredients, recipes and Cooks you choose.",
          "When you send a service request to a Cook, information may include your name, email address, phone number if provided, requested date, location, budget and message.",
        ],
      },
      {
        title:
          "2. How we use information",
        paragraphs: [
          "We use information to operate Alf Sahten, manage accounts, provide platform features, display public content, save your preferences and allow users and Cooks to interact.",
          "We may also use information to review Cook applications, moderate recipes and services, prevent misuse, investigate technical problems and protect the security of the platform.",
        ],
      },
      {
        title:
          "3. Information visible to other users",
        paragraphs: [
          "Approved recipes and approved public Cook profiles may be visible to anyone using Alf Sahten.",
          "Only information intended for a public Cook profile is displayed publicly. Account information and service-request information are not intended to be publicly displayed.",
          "When you send a service request, relevant request information is shared with the Cook receiving that request so the Cook can respond.",
        ],
      },
      {
        title:
          "4. Service providers",
        paragraphs: [
          "Alf Sahten uses third-party technology providers to operate the platform. Supabase is currently used for services including authentication, database functionality and file storage.",
          "These providers may process information as necessary to provide their services and are subject to their own privacy and security practices.",
        ],
      },
      {
        title:
          "5. Data retention",
        paragraphs: [
          "Information may be retained for as long as reasonably necessary to operate the platform, maintain records, resolve disputes, protect users and comply with applicable legal obligations.",
          "Some information may remain in backups or records for a limited period after it is changed or removed.",
        ],
      },
      {
        title:
          "6. Your choices",
        paragraphs: [
          "Depending on the feature, you can update certain profile information, remove saved items, manage kitchen ingredients, unfollow Cooks and manage content you have created.",
          "For privacy questions or requests relating to your personal information, contact Alf Sahten through the official contact information provided on the platform.",
        ],
      },
      {
        title:
          "7. Security",
        paragraphs: [
          "We use technical and organizational measures intended to protect information, including authentication controls and database access policies.",
          "No online service can guarantee absolute security. You are responsible for keeping your account credentials confidential.",
        ],
      },
      {
        title:
          "8. Changes to this policy",
        paragraphs: [
          "We may update this Privacy Policy as Alf Sahten develops. When important changes are made, the updated version and its revision date will be published on this page.",
        ],
      },
    ],
  },

  fr: {
    title:
      "Politique de confidentialité",
    intro:
      "Cette politique de confidentialité explique comment Alf Sahten traite les informations lorsque vous utilisez la plateforme.",
    lastUpdated:
      "Dernière mise à jour : 2 octobre 2026",
    sections: [
      {
        title:
          "1. Informations que vous fournissez",
        paragraphs: [
          "Lorsque vous créez ou utilisez un compte Alf Sahten, vous pouvez fournir des informations telles que votre adresse e-mail, les informations de votre profil et vos préférences linguistiques.",
          "Si vous demandez à devenir Cook, vous pouvez fournir des informations supplémentaires pour votre candidature et votre profil public de Cook.",
          "Lorsque vous publiez des recettes ou des services, vous pouvez fournir des titres, descriptions, ingrédients, instructions, photos et autres contenus.",
          "Les fonctionnalités telles que My Kitchen, Saved Recipes et le suivi des Cooks peuvent enregistrer des informations concernant les ingrédients, recettes et Cooks que vous choisissez.",
          "Lorsque vous envoyez une demande de service à un Cook, les informations peuvent inclure votre nom, votre adresse e-mail, votre numéro de téléphone s'il est fourni, la date souhaitée, le lieu, le budget et votre message.",
        ],
      },
      {
        title:
          "2. Comment nous utilisons les informations",
        paragraphs: [
          "Nous utilisons les informations pour faire fonctionner Alf Sahten, gérer les comptes, fournir les fonctionnalités de la plateforme, afficher les contenus publics, enregistrer vos préférences et permettre les interactions entre utilisateurs et Cooks.",
          "Nous pouvons également utiliser ces informations pour examiner les candidatures des Cooks, modérer les recettes et services, prévenir les abus, résoudre les problèmes techniques et protéger la sécurité de la plateforme.",
        ],
      },
      {
        title:
          "3. Informations visibles par les autres utilisateurs",
        paragraphs: [
          "Les recettes approuvées et les profils publics approuvés des Cooks peuvent être visibles par toute personne utilisant Alf Sahten.",
          "Seules les informations destinées au profil public du Cook sont affichées publiquement. Les informations du compte et les informations contenues dans les demandes de service ne sont pas destinées à être affichées publiquement.",
          "Lorsque vous envoyez une demande de service, les informations nécessaires de cette demande sont partagées avec le Cook concerné afin qu'il puisse vous répondre.",
        ],
      },
      {
        title:
          "4. Prestataires de services",
        paragraphs: [
          "Alf Sahten utilise des prestataires technologiques tiers pour faire fonctionner la plateforme. Supabase est actuellement utilisé notamment pour l'authentification, la base de données et le stockage de fichiers.",
          "Ces prestataires peuvent traiter les informations nécessaires à la fourniture de leurs services et appliquent leurs propres pratiques de confidentialité et de sécurité.",
        ],
      },
      {
        title:
          "5. Conservation des données",
        paragraphs: [
          "Les informations peuvent être conservées aussi longtemps que cela est raisonnablement nécessaire pour faire fonctionner la plateforme, conserver certains dossiers, résoudre des litiges, protéger les utilisateurs et respecter les obligations légales applicables.",
          "Certaines informations peuvent rester pendant une période limitée dans des sauvegardes ou des archives après leur modification ou leur suppression.",
        ],
      },
      {
        title:
          "6. Vos choix",
        paragraphs: [
          "Selon la fonctionnalité, vous pouvez modifier certaines informations de votre profil, supprimer des éléments enregistrés, gérer les ingrédients de votre cuisine, ne plus suivre un Cook et gérer les contenus que vous avez créés.",
          "Pour toute question ou demande concernant vos données personnelles, contactez Alf Sahten par l'intermédiaire des coordonnées officielles indiquées sur la plateforme.",
        ],
      },
      {
        title:
          "7. Sécurité",
        paragraphs: [
          "Nous utilisons des mesures techniques et organisationnelles destinées à protéger les informations, notamment des contrôles d'authentification et des politiques d'accès à la base de données.",
          "Aucun service en ligne ne peut garantir une sécurité absolue. Vous êtes responsable de la confidentialité de vos identifiants de connexion.",
        ],
      },
      {
        title:
          "8. Modifications de cette politique",
        paragraphs: [
          "Nous pouvons mettre à jour cette politique de confidentialité au fur et à mesure de l'évolution d'Alf Sahten. Lorsqu'une modification importante est apportée, la nouvelle version et sa date de mise à jour seront publiées sur cette page.",
        ],
      },
    ],
  },

  ar: {
    title: "سياسة الخصوصية",
    intro:
      "توضح سياسة الخصوصية هذه كيفية تعامل ألف صحتين مع المعلومات عند استخدام المنصة.",
    lastUpdated:
      "آخر تحديث: 2 أكتوبر 2026",
    sections: [
      {
        title:
          "1. المعلومات التي تقدمها",
        paragraphs: [
          "عند إنشاء حساب على ألف صحتين أو استخدامه، قد تقدم معلومات مثل عنوان بريدك الإلكتروني وبيانات ملفك الشخصي وتفضيلات اللغة.",
          "إذا تقدمت لتصبح طاهيًا على المنصة، فقد تقدم معلومات إضافية ضمن طلبك وملفك العام كطاهٍ.",
          "عند نشر وصفات أو خدمات، قد تقدم عناوين وأوصافًا ومكونات وتعليمات وصورًا ومحتوى آخر.",
          "قد تحفظ ميزات مثل مطبخي والوصفات المحفوظة ومتابعة الطهاة معلومات عن المكونات والوصفات والطهاة الذين تختارهم.",
          "عند إرسال طلب خدمة إلى طاهٍ، قد تشمل المعلومات اسمك وعنوان بريدك الإلكتروني ورقم هاتفك إذا قدمته والتاريخ المطلوب والموقع والميزانية والرسالة.",
        ],
      },
      {
        title:
          "2. كيفية استخدام المعلومات",
        paragraphs: [
          "نستخدم المعلومات لتشغيل ألف صحتين وإدارة الحسابات وتوفير ميزات المنصة وعرض المحتوى العام وحفظ تفضيلاتك وتمكين التفاعل بين المستخدمين والطهاة.",
          "قد نستخدم المعلومات أيضًا لمراجعة طلبات الطهاة والإشراف على الوصفات والخدمات ومنع إساءة الاستخدام والتحقيق في المشكلات التقنية وحماية أمن المنصة.",
        ],
      },
      {
        title:
          "3. المعلومات التي يمكن للآخرين رؤيتها",
        paragraphs: [
          "قد تكون الوصفات المعتمدة والملفات العامة المعتمدة للطهاة مرئية لأي شخص يستخدم ألف صحتين.",
          "يتم عرض المعلومات المخصصة للملف العام للطاهي فقط. ولا يُقصد عرض معلومات الحساب أو معلومات طلبات الخدمات للعامة.",
          "عند إرسال طلب خدمة، تتم مشاركة المعلومات ذات الصلة بالطلب مع الطاهي الذي يتلقى الطلب حتى يتمكن من الرد عليك.",
        ],
      },
      {
        title:
          "4. مزودو الخدمات",
        paragraphs: [
          "تستخدم ألف صحتين مزودي خدمات تقنية خارجيين لتشغيل المنصة. وتُستخدم Supabase حاليًا لخدمات تشمل تسجيل الدخول وقاعدة البيانات وتخزين الملفات.",
          "قد يعالج هؤلاء المزودون المعلومات بالقدر اللازم لتقديم خدماتهم ويخضعون لممارسات الخصوصية والأمان الخاصة بهم.",
        ],
      },
      {
        title:
          "5. الاحتفاظ بالبيانات",
        paragraphs: [
          "قد نحتفظ بالمعلومات للمدة المعقولة اللازمة لتشغيل المنصة وحفظ السجلات وحل النزاعات وحماية المستخدمين والامتثال للالتزامات القانونية المعمول بها.",
          "قد تبقى بعض المعلومات في النسخ الاحتياطية أو السجلات لفترة محدودة بعد تعديلها أو حذفها.",
        ],
      },
      {
        title:
          "6. خياراتك",
        paragraphs: [
          "بحسب الميزة، يمكنك تعديل بعض معلومات ملفك الشخصي وإزالة العناصر المحفوظة وإدارة مكونات مطبخك وإلغاء متابعة الطهاة وإدارة المحتوى الذي أنشأته.",
          "لأي سؤال أو طلب يتعلق بخصوصيتك أو معلوماتك الشخصية، تواصل مع ألف صحتين من خلال معلومات الاتصال الرسمية المتوفرة على المنصة.",
        ],
      },
      {
        title:
          "7. الأمان",
        paragraphs: [
          "نستخدم إجراءات تقنية وتنظيمية تهدف إلى حماية المعلومات، بما في ذلك ضوابط تسجيل الدخول وسياسات الوصول إلى قاعدة البيانات.",
          "لا يمكن لأي خدمة عبر الإنترنت ضمان الأمان بشكل مطلق. وأنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول إلى حسابك.",
        ],
      },
      {
        title:
          "8. التغييرات على هذه السياسة",
        paragraphs: [
          "قد نقوم بتحديث سياسة الخصوصية مع تطور ألف صحتين. وعند إجراء تغييرات مهمة، سيتم نشر النسخة المحدثة وتاريخ تعديلها على هذه الصفحة.",
        ],
      },
    ],
  },
};

export const termsContent: Record<
  LegalLanguage,
  LegalDocument
> = {
  en: {
    title: "Terms of Use",
    intro:
      "These Terms of Use govern your use of Alf Sahten. By using the platform, you agree to these terms.",
    lastUpdated:
      "Last updated: October 2, 2026",
    sections: [
      {
        title:
          "1. Accounts and eligibility",
        paragraphs: [
          "You are responsible for providing accurate account information and keeping your login credentials secure.",
          "You are responsible for activity performed through your account unless you have reported unauthorized access.",
        ],
      },
      {
        title:
          "2. Recipes and user content",
        paragraphs: [
          "You remain responsible for recipes, photos, descriptions and other content that you submit to Alf Sahten.",
          "By submitting content for publication, you give Alf Sahten permission to store, process and display that content as necessary to operate and promote the platform.",
          "You must not submit content that you do not have the right to use or that unlawfully infringes another person's rights.",
        ],
      },
      {
        title:
          "3. Recipe and food information",
        paragraphs: [
          "Recipes and cooking information on Alf Sahten are provided for informational purposes.",
          "Users are responsible for checking ingredients, allergens, dietary suitability, cooking temperatures, food safety and any individual health requirements before preparing or consuming food.",
        ],
      },
      {
        title:
          "4. Cooks and service requests",
        paragraphs: [
          "Alf Sahten may allow approved Cooks to offer services and users to send service requests through the platform.",
          "Unless expressly stated otherwise, any service arrangement is made directly between the user and the Cook. Alf Sahten is not the provider of the Cook's service and does not guarantee availability, pricing, quality or the outcome of a service.",
          "Users and Cooks are responsible for agreeing directly on the final service details and any obligations between them.",
        ],
      },
      {
        title:
          "5. Acceptable use",
        paragraphs: [
          "You must not use Alf Sahten for unlawful, fraudulent, abusive, misleading or harmful activity.",
          "You must not attempt to interfere with the security or operation of the platform, access another person's account without permission or misuse information obtained through the platform.",
        ],
      },
      {
        title:
          "6. Moderation",
        paragraphs: [
          "Alf Sahten may review Cook applications, recipes, services and other submitted content.",
          "We may reject, remove or restrict content or accounts when reasonably necessary to enforce these terms, protect users, comply with legal obligations or maintain the quality and security of the platform.",
        ],
      },
      {
        title:
          "7. Platform availability",
        paragraphs: [
          "We aim to keep Alf Sahten available and reliable, but we do not guarantee uninterrupted or error-free operation.",
          "Features may be changed, suspended or discontinued as the platform develops.",
        ],
      },
      {
        title:
          "8. Disclaimer and liability",
        paragraphs: [
          "To the extent permitted by applicable law, Alf Sahten is provided on an as-is and as-available basis.",
          "Alf Sahten is not responsible for losses arising solely from arrangements between users and Cooks or from reliance on user-submitted recipes, reviews or other content, except where responsibility cannot legally be excluded.",
        ],
      },
      {
        title:
          "9. Changes to these terms",
        paragraphs: [
          "We may update these Terms of Use as Alf Sahten develops. The latest version and its revision date will be published on this page.",
          "Continuing to use the platform after updated terms become effective means that the updated terms apply to your continued use.",
        ],
      },
      {
        title: "10. Contact",
        paragraphs: [
          "Questions about these terms can be sent through the official Alf Sahten contact information provided on the platform.",
        ],
      },
    ],
  },

  fr: {
    title:
      "Conditions d'utilisation",
    intro:
      "Les présentes conditions d'utilisation régissent votre utilisation d'Alf Sahten. En utilisant la plateforme, vous acceptez ces conditions.",
    lastUpdated:
      "Dernière mise à jour : 2 octobre 2026",
    sections: [
      {
        title:
          "1. Comptes et utilisation",
        paragraphs: [
          "Vous êtes responsable de fournir des informations exactes concernant votre compte et de protéger vos identifiants de connexion.",
          "Vous êtes responsable de l'activité effectuée depuis votre compte sauf si vous avez signalé un accès non autorisé.",
        ],
      },
      {
        title:
          "2. Recettes et contenu des utilisateurs",
        paragraphs: [
          "Vous restez responsable des recettes, photos, descriptions et autres contenus que vous soumettez à Alf Sahten.",
          "En soumettant un contenu destiné à être publié, vous autorisez Alf Sahten à le stocker, le traiter et l'afficher dans la mesure nécessaire au fonctionnement et à la promotion de la plateforme.",
          "Vous ne devez pas soumettre de contenu que vous n'avez pas le droit d'utiliser ou qui porte illégalement atteinte aux droits d'une autre personne.",
        ],
      },
      {
        title:
          "3. Recettes et informations alimentaires",
        paragraphs: [
          "Les recettes et informations culinaires proposées sur Alf Sahten sont fournies à titre informatif.",
          "Les utilisateurs sont responsables de la vérification des ingrédients, allergènes, régimes alimentaires, températures de cuisson, règles de sécurité alimentaire et besoins de santé individuels avant de préparer ou consommer un aliment.",
        ],
      },
      {
        title:
          "4. Cooks et demandes de service",
        paragraphs: [
          "Alf Sahten peut permettre aux Cooks approuvés de proposer des services et aux utilisateurs d'envoyer des demandes de service par l'intermédiaire de la plateforme.",
          "Sauf indication contraire expresse, tout accord concernant un service est conclu directement entre l'utilisateur et le Cook. Alf Sahten n'est pas le prestataire du service du Cook et ne garantit ni la disponibilité, ni le prix, ni la qualité, ni le résultat d'un service.",
          "L'utilisateur et le Cook sont responsables de convenir directement des détails définitifs du service et de leurs obligations respectives.",
        ],
      },
      {
        title:
          "5. Utilisation acceptable",
        paragraphs: [
          "Vous ne devez pas utiliser Alf Sahten pour une activité illégale, frauduleuse, abusive, trompeuse ou nuisible.",
          "Vous ne devez pas tenter de compromettre la sécurité ou le fonctionnement de la plateforme, accéder au compte d'une autre personne sans autorisation ou utiliser abusivement des informations obtenues par l'intermédiaire de la plateforme.",
        ],
      },
      {
        title: "6. Modération",
        paragraphs: [
          "Alf Sahten peut examiner les candidatures des Cooks, les recettes, les services et les autres contenus soumis.",
          "Nous pouvons refuser, supprimer ou limiter un contenu ou un compte lorsque cela est raisonnablement nécessaire pour appliquer ces conditions, protéger les utilisateurs, respecter les obligations légales ou maintenir la qualité et la sécurité de la plateforme.",
        ],
      },
      {
        title:
          "7. Disponibilité de la plateforme",
        paragraphs: [
          "Nous cherchons à maintenir Alf Sahten disponible et fiable mais nous ne garantissons pas un fonctionnement continu ou exempt d'erreurs.",
          "Certaines fonctionnalités peuvent être modifiées, suspendues ou supprimées au fur et à mesure de l'évolution de la plateforme.",
        ],
      },
      {
        title:
          "8. Exclusion de garanties et responsabilité",
        paragraphs: [
          "Dans les limites autorisées par la loi applicable, Alf Sahten est fourni en l'état et selon sa disponibilité.",
          "Alf Sahten n'est pas responsable des pertes résultant uniquement d'accords conclus entre utilisateurs et Cooks ou de la confiance accordée à des recettes, avis ou autres contenus soumis par les utilisateurs, sauf lorsque cette responsabilité ne peut légalement être exclue.",
        ],
      },
      {
        title:
          "9. Modifications de ces conditions",
        paragraphs: [
          "Nous pouvons modifier les présentes conditions d'utilisation au fur et à mesure de l'évolution d'Alf Sahten. La version la plus récente et sa date de mise à jour seront publiées sur cette page.",
          "Le fait de continuer à utiliser la plateforme après l'entrée en vigueur des nouvelles conditions signifie que ces conditions s'appliquent à votre utilisation ultérieure.",
        ],
      },
      {
        title: "10. Contact",
        paragraphs: [
          "Les questions concernant ces conditions peuvent être envoyées par l'intermédiaire des coordonnées officielles d'Alf Sahten indiquées sur la plateforme.",
        ],
      },
    ],
  },

  ar: {
    title: "شروط الاستخدام",
    intro:
      "تحكم شروط الاستخدام هذه استخدامك لمنصة ألف صحتين. باستخدام المنصة، فإنك توافق على هذه الشروط.",
    lastUpdated:
      "آخر تحديث: 2 أكتوبر 2026",
    sections: [
      {
        title:
          "1. الحسابات والاستخدام",
        paragraphs: [
          "أنت مسؤول عن تقديم معلومات صحيحة عن حسابك والحفاظ على سرية بيانات تسجيل الدخول.",
          "أنت مسؤول عن النشاط الذي يتم من خلال حسابك ما لم تكن قد أبلغت عن وصول غير مصرح به.",
        ],
      },
      {
        title:
          "2. الوصفات ومحتوى المستخدمين",
        paragraphs: [
          "تبقى مسؤولًا عن الوصفات والصور والأوصاف وأي محتوى آخر تقدمه إلى ألف صحتين.",
          "عند تقديم محتوى للنشر، فإنك تمنح ألف صحتين الإذن بتخزينه ومعالجته وعرضه بالقدر اللازم لتشغيل المنصة والترويج لها.",
          "يجب ألا تقدم محتوى لا تملك الحق في استخدامه أو ينتهك بشكل غير قانوني حقوق شخص آخر.",
        ],
      },
      {
        title:
          "3. الوصفات والمعلومات الغذائية",
        paragraphs: [
          "يتم توفير الوصفات ومعلومات الطهي على ألف صحتين لأغراض معلوماتية.",
          "يتحمل المستخدم مسؤولية التحقق من المكونات والحساسيات الغذائية ومدى ملاءمة الطعام لنظامه الغذائي ودرجات حرارة الطهي وسلامة الغذاء وأي متطلبات صحية شخصية قبل تحضير الطعام أو تناوله.",
        ],
      },
      {
        title:
          "4. الطهاة وطلبات الخدمات",
        paragraphs: [
          "قد تسمح ألف صحتين للطهاة المعتمدين بعرض خدمات وللمستخدمين بإرسال طلبات خدمات من خلال المنصة.",
          "ما لم يتم النص صراحة على خلاف ذلك، يتم أي اتفاق بشأن الخدمة مباشرة بين المستخدم والطاهي. ألف صحتين ليست الجهة المقدمة لخدمة الطاهي ولا تضمن توفر الخدمة أو سعرها أو جودتها أو نتيجتها.",
          "يتحمل المستخدم والطاهي مسؤولية الاتفاق مباشرة على التفاصيل النهائية للخدمة وأي التزامات بينهما.",
        ],
      },
      {
        title:
          "5. الاستخدام المقبول",
        paragraphs: [
          "يجب ألا تستخدم ألف صحتين في أي نشاط غير قانوني أو احتيالي أو مسيء أو مضلل أو ضار.",
          "يجب ألا تحاول التدخل في أمان المنصة أو تشغيلها أو الدخول إلى حساب شخص آخر دون إذن أو إساءة استخدام المعلومات التي تحصل عليها من خلال المنصة.",
        ],
      },
      {
        title: "6. الإشراف",
        paragraphs: [
          "قد تراجع ألف صحتين طلبات الطهاة والوصفات والخدمات وغيرها من المحتويات المقدمة.",
          "يجوز لنا رفض المحتوى أو حذفه أو تقييده أو تقييد الحسابات عندما يكون ذلك ضروريًا بشكل معقول لتطبيق هذه الشروط أو حماية المستخدمين أو الامتثال للالتزامات القانونية أو الحفاظ على جودة المنصة وأمانها.",
        ],
      },
      {
        title:
          "7. توفر المنصة",
        paragraphs: [
          "نسعى إلى إبقاء ألف صحتين متاحة وموثوقة، لكننا لا نضمن أن تعمل دون انقطاع أو أخطاء.",
          "قد يتم تعديل بعض الميزات أو تعليقها أو إيقافها مع تطور المنصة.",
        ],
      },
      {
        title:
          "8. إخلاء المسؤولية",
        paragraphs: [
          "بالقدر الذي يسمح به القانون المعمول به، يتم توفير ألف صحتين كما هي وحسب توفرها.",
          "لا تتحمل ألف صحتين المسؤولية عن الخسائر الناتجة فقط عن الاتفاقات بين المستخدمين والطهاة أو عن الاعتماد على الوصفات أو التقييمات أو المحتوى الآخر الذي يقدمه المستخدمون، إلا عندما لا يسمح القانون باستبعاد هذه المسؤولية.",
        ],
      },
      {
        title:
          "9. التغييرات على هذه الشروط",
        paragraphs: [
          "قد نقوم بتحديث شروط الاستخدام مع تطور ألف صحتين. وسيتم نشر أحدث نسخة وتاريخ تعديلها على هذه الصفحة.",
          "استمرارك في استخدام المنصة بعد دخول الشروط المحدثة حيز التنفيذ يعني أن الشروط المحدثة تنطبق على استمرار استخدامك.",
        ],
      },
      {
        title: "10. التواصل",
        paragraphs: [
          "يمكن إرسال الأسئلة المتعلقة بهذه الشروط من خلال معلومات الاتصال الرسمية الخاصة بألف صحتين والمتوفرة على المنصة.",
        ],
      },
    ],
  },
};