import {
  ArrowLeft,
  Download,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import CookDashboardNav from "../components/CookDashboardNav";
import { supabase } from "../lib/supabase";
import "./InstagramImportPage.css";

type InstagramMedia = {
  id: string;
  caption: string;
  mediaType: string | null;
  mediaProductType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
};

function InstagramImportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [media, setMedia] =
    useState<InstagramMedia[]>([]);
  const [instagramUsername, setInstagramUsername] =
    useState<string | null>(null);
const [loading, setLoading] = useState(true);

const [error, setError] =
  useState<string | null>(null);

const [
  connectingInstagram,
  setConnectingInstagram,
] = useState(false);

const [importedRecipes, setImportedRecipes] =
  useState<
    Map<
      string,
      {
        id: string;
        status: string;
      }
    >
  >(new Map());

  useEffect(() => {
    async function loadInstagramMedia() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } =
          await supabase.functions.invoke(
            "instagram-media",
            {
              body: {},
            },
          );

        if (functionError) {
          throw functionError;
        }

        if (!data?.connected) {
          setError(
  t("instagramImport.notConnected"),
);
          return;
        }

        setInstagramUsername(
          data.instagramUsername ?? null,
        );

const loadedMedia = Array.isArray(data.media)
  ? data.media
  : [];

setMedia(loadedMedia);

if (loadedMedia.length > 0) {
  const mediaIds = loadedMedia.map(
    (item: InstagramMedia) => item.id,
  );

const {
  data: importedRecipeRows,
  error: importedRecipesError,
} = await supabase
  .from("recipes")
.select("id, instagram_media_id, status")
  .in("instagram_media_id", mediaIds);

if (importedRecipesError) {
  throw importedRecipesError;
}

setImportedRecipes(
  new Map(
    (importedRecipeRows ?? [])
      .filter(
        (
          recipe,
        ): recipe is {
          id: string;
          instagram_media_id: string;
          status: string;
        } =>
          typeof recipe.id === "string" &&
          typeof recipe.instagram_media_id ===
            "string" &&
          typeof recipe.status === "string",
      )
      .map((recipe) => [
        recipe.instagram_media_id,
        {
          id: recipe.id,
          status: recipe.status,
        },
      ]),
  ),
);
}

} catch (err) {
        console.error(err);

setError(
  t("instagramImport.loadError"),
);
      } finally {
        setLoading(false);
      }
    }

    loadInstagramMedia();
  }, [t]);

  async function handleConnectInstagram() {
  try {
    setConnectingInstagram(true);
    setError(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      setError(
        t("myRecipes.signInRequired"),
      );
      setConnectingInstagram(false);
      return;
    }

    const {
      data,
      error: functionError,
    } = await supabase.functions.invoke(
      "instagram-oauth-start",
    );

    if (functionError) {
      throw functionError;
    }

    if (
      !data ||
      typeof data.url !== "string"
    ) {
      throw new Error(
        "Instagram authorization URL missing",
      );
    }

    window.location.assign(data.url);
  } catch (err) {
    console.error(err);

    setError(
      t("myRecipes.instagramConnectError"),
    );

    setConnectingInstagram(false);
  }
}

  return (
    <main className="instagram-import-page">
      <CookDashboardNav />

      <section>
        <Link to="/cook/recipes">
          <ArrowLeft size={18} />
          {t("instagramImport.backToRecipes")}
        </Link>

        <p className="eyebrow">
          {t("instagramImport.eyebrow")}
        </p>

        <h1>
          <Download size={28} />
          {t("instagramImport.title")}
        </h1>

        <p>
          {t("instagramImport.intro")}
        </p>

        {instagramUsername && (
          <p>
            {t("instagramImport.connectedAs", {
  username: instagramUsername,
})}
          </p>
        )}

        {loading && (
          <p>{t("instagramImport.loading")}</p>
        )}

{error && (
  <div>
    <p className="form-error">
      {error}
    </p>

    {error ===
      t("instagramImport.notConnected") && (
      <button
        type="button"
        className="instagram-import-button"
        onClick={() =>
          void handleConnectInstagram()
        }
        disabled={
          connectingInstagram
        }
      >
        {connectingInstagram
          ? t(
              "myRecipes.connectingInstagram",
            )
          : t(
              "myRecipes.connectInstagram",
            )}
      </button>
    )}
  </div>
)}

        {!loading &&
          !error &&
          media.length === 0 && (
            <p>
              {t("instagramImport.noPosts")}
            </p>
          )}

        {!loading &&
          !error &&
          media.length > 0 && (
            <div>
              {media.map((item) => {
                const image =
                  item.thumbnailUrl ||
                  item.mediaUrl;

                return (
                  <article key={item.id}>
                    {image && (
                      <img
                        src={image}
                        alt=""
                      />
                    )}

                    {item.caption && (
  <p>
    {item.caption}
  </p>
)}

{importedRecipes.has(item.id) ? (
  importedRecipes.get(item.id)?.status === "approved" ? (
    <button
      type="button"
      onClick={() =>
        navigate(
          `/recipe/${importedRecipes.get(item.id)?.id}`,
        )
      }
    >
      {t("instagramImport.viewPublishedRecipe")}
    </button>
  ) : (
    <button
      type="button"
      onClick={() =>
        navigate(
          `/cook/recipes/${importedRecipes.get(item.id)?.id}/edit`,
        )
      }
    >
      {t("instagramImport.editImportedRecipe")}
    </button>
  )
) : (
  <button
    type="button"
    onClick={() =>
      navigate("/cook/recipes/new", {
        state: {
          instagramImport: item,
        },
      })
    }
  >
    Import this recipe
  </button>
)}
                  </article>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}

export default InstagramImportPage;