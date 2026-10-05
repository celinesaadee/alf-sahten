import {
  Archive as ArchiveIcon,
  ArrowRight,
  ChefHat,
  FolderOpen,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { usePublishedRecipes } from "../hooks/usePublishedRecipes";
import {
  archiveCollection,
  createCollection,
  getCollectionsWithRecipes,
  removeRecipeFromCollection,
  renameCollection,
  restoreCollection,
  type CollectionWithRecipes,
} from "../services/collections";

function CollectionsPage() {
  const { t } = useTranslation();

  const {
    recipes,
    loading: recipesLoading,
    error: recipesError,
  } = usePublishedRecipes();

  const [
    collections,
    setCollections,
  ] = useState<
    CollectionWithRecipes[]
  >([]);

  const [
    collectionsLoading,
    setCollectionsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    newName,
    setNewName,
  ] = useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState<string | null>(
    null,
  );

  const [
    renameId,
    setRenameId,
  ] = useState<string | null>(
    null,
  );

  const [
    renameValue,
    setRenameValue,
  ] = useState("");

  const [
    showArchived,
    setShowArchived,
  ] = useState(false);

  async function loadCollections() {
    try {
      setCollectionsLoading(true);
      setError(null);

      const rows =
        await getCollectionsWithRecipes(
          true,
        );

      setCollections(rows);
    } catch (err) {
      console.error(
        "Could not load collections:",
        err,
      );

      setError(
        t(
          "collections.loadError",
          {
            defaultValue:
              "Could not load your collections.",
          },
        ),
      );
    } finally {
      setCollectionsLoading(false);
    }
  }

 useEffect(() => {
  let cancelled = false;

  async function loadInitialCollections() {
    try {
      const rows =
        await getCollectionsWithRecipes(
          true,
        );

      if (!cancelled) {
        setCollections(rows);
      }
    } catch (err) {
      console.error(
        "Could not load collections:",
        err,
      );

      if (!cancelled) {
        setError(
          t(
            "collections.loadError",
            {
              defaultValue:
                "Could not load your collections.",
            },
          ),
        );
      }
    } finally {
      if (!cancelled) {
        setCollectionsLoading(false);
      }
    }
  }

  void loadInitialCollections();

  return () => {
    cancelled = true;
  };
}, [t]);

  const recipeMap = useMemo(
    () =>
      new Map(
        recipes.map(
          (recipe) => [
            recipe.id,
            recipe,
          ],
        ),
      ),
    [recipes],
  );

  const activeCollections =
    collections.filter(
      (collection) =>
        !collection.archived,
    );

  const archivedCollections =
    collections.filter(
      (collection) =>
        collection.archived,
    );

  const visibleCollections =
    showArchived
      ? archivedCollections
      : activeCollections;

  async function handleCreate() {
    const cleanName =
      newName.trim();

    if (
      !cleanName ||
      creating
    ) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      await createCollection(
        cleanName,
      );

      setNewName("");

      await loadCollections();
    } catch (err) {
      console.error(
        "Could not create collection:",
        err,
      );

      setError(
        t(
          "collections.createError",
          {
            defaultValue:
              "Could not create the collection. Make sure the name is not already in use.",
          },
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  function startRename(
    collection: CollectionWithRecipes,
  ) {
    setRenameId(
      collection.id,
    );

    setRenameValue(
      collection.name,
    );
  }

  function cancelRename() {
    setRenameId(null);
    setRenameValue("");
  }

  async function handleRename(
    collectionId: string,
  ) {
    const cleanName =
      renameValue.trim();

    if (!cleanName) {
      return;
    }

    try {
      setBusyId(collectionId);
      setError(null);

      await renameCollection(
        collectionId,
        cleanName,
      );

      cancelRename();

      await loadCollections();
    } catch (err) {
      console.error(
        "Could not rename collection:",
        err,
      );

      setError(
        t(
          "collections.renameError",
          {
            defaultValue:
              "Could not rename the collection.",
          },
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchive(
    collectionId: string,
  ) {
    try {
      setBusyId(collectionId);
      setError(null);

      await archiveCollection(
        collectionId,
      );

      await loadCollections();
    } catch (err) {
      console.error(
        "Could not archive collection:",
        err,
      );

      setError(
        t(
          "collections.archiveError",
          {
            defaultValue:
              "Could not archive the collection.",
          },
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(
    collectionId: string,
  ) {
    try {
      setBusyId(collectionId);
      setError(null);

      await restoreCollection(
        collectionId,
      );

      await loadCollections();
    } catch (err) {
      console.error(
        "Could not restore collection:",
        err,
      );

      setError(
        t(
          "collections.restoreError",
          {
            defaultValue:
              "Could not restore the collection.",
          },
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveRecipe(
    collectionId: string,
    recipeId: string,
  ) {
    try {
      setBusyId(
        `${collectionId}:${recipeId}`,
      );

      setError(null);

      await removeRecipeFromCollection(
        collectionId,
        recipeId,
      );

      setCollections(
        (current) =>
          current.map(
            (collection) =>
              collection.id ===
              collectionId
                ? {
                    ...collection,
                    recipeIds:
                      collection.recipeIds.filter(
                        (id) =>
                          id !==
                          recipeId,
                      ),
                  }
                : collection,
          ),
      );
    } catch (err) {
      console.error(
        "Could not remove recipe:",
        err,
      );

      setError(
        t(
          "collections.removeRecipeError",
          {
            defaultValue:
              "Could not remove the recipe from this collection.",
          },
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  const loading =
    collectionsLoading ||
    recipesLoading;

  if (loading) {
    return (
      <main className="collections-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  return (
    <main className="collections-page">
      <section className="collections-hero">
        <div>
          <p className="section-kicker">
            {t(
              "collections.kicker",
              {
                defaultValue:
                  "Saved your way",
              },
            )}
          </p>

          <h1>
            {t(
              "collections.title",
              {
                defaultValue:
                  "My collections",
              },
            )}
          </h1>

          <p className="collections-hero-copy">
            {t(
              "collections.subtitle",
              {
                defaultValue:
                  "Organize recipes into private collections for the moments, people and meals you cook for.",
              },
            )}
          </p>
        </div>

        <div className="collections-private-note">
          <FolderOpen size={20} />

          <span>
            {t(
              "collections.privateNote",
              {
                defaultValue:
                  "Your collections are private to your account.",
              },
            )}
          </span>
        </div>
      </section>

      <section className="collections-create-card">
        <div>
          <p className="section-kicker">
            {t(
              "collections.createKicker",
              {
                defaultValue:
                  "Start a collection",
              },
            )}
          </p>

          <h2>
            {t(
              "collections.createTitle",
              {
                defaultValue:
                  "What are you saving for?",
              },
            )}
          </h2>
        </div>

        <div className="collections-create-row">
          <input
            type="text"
            value={newName}
            onChange={(event) =>
              setNewName(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();

                void handleCreate();
              }
            }}
            placeholder={t(
              "collections.namePlaceholder",
              {
                defaultValue:
                  "e.g. Sunday lunch",
              },
            )}
            maxLength={80}
          />

          <button
            type="button"
            onClick={() =>
              void handleCreate()
            }
            disabled={
              creating ||
              !newName.trim()
            }
          >
            <Plus size={18} />

            <span>
              {creating
                ? t(
                    "collections.creating",
                    {
                      defaultValue:
                        "Creating...",
                    },
                  )
                : t(
                    "collections.create",
                    {
                      defaultValue:
                        "Create collection",
                    },
                  )}
            </span>
          </button>
        </div>
      </section>

      <section className="collections-content">
        <div className="collections-toolbar">
          <div className="collections-tabs">
            <button
              type="button"
              className={
                !showArchived
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setShowArchived(
                  false,
                )
              }
            >
              {t(
                "collections.active",
                {
                  defaultValue:
                    "Collections",
                },
              )}

              <span>
                {
                  activeCollections.length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                showArchived
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setShowArchived(
                  true,
                )
              }
            >
              {t(
                "collections.archived",
                {
                  defaultValue:
                    "Archived",
                },
              )}

              <span>
                {
                  archivedCollections.length
                }
              </span>
            </button>
          </div>
        </div>

        {(error ||
          recipesError) && (
          <div
            className="collections-error"
            role="alert"
          >
            {error ??
              t(
                "collections.recipeLoadError",
                {
                  defaultValue:
                    "Some recipes could not be loaded.",
                },
              )}
          </div>
        )}

        {visibleCollections.length ===
        0 ? (
          <div className="collections-empty">
            <div className="collections-empty-icon">
              {showArchived ? (
                <ArchiveIcon
                  size={28}
                />
              ) : (
                <FolderOpen
                  size={28}
                />
              )}
            </div>

            <h2>
              {showArchived
                ? t(
                    "collections.noArchivedTitle",
                    {
                      defaultValue:
                        "Nothing archived",
                    },
                  )
                : t(
                    "collections.emptyTitle",
                    {
                      defaultValue:
                        "Create your first collection",
                    },
                  )}
            </h2>

            <p>
              {showArchived
                ? t(
                    "collections.noArchivedText",
                    {
                      defaultValue:
                        "Collections you archive will stay here until you restore them.",
                    },
                  )
                : t(
                    "collections.emptyText",
                    {
                      defaultValue:
                        "Group recipes by mood, occasion, person or anything else that makes sense to you.",
                    },
                  )}
            </p>

            {!showArchived && (
              <Link to="/discover">
                {t(
                  "saved.discoverRecipes",
                  {
                    defaultValue:
                      "Discover recipes",
                  },
                )}

                <ArrowRight
                  size={17}
                />
              </Link>
            )}
          </div>
        ) : (
          <div className="collections-grid">
            {visibleCollections.map(
              (collection) => {
                const collectionRecipes =
                  collection.recipeIds
                    .map((id) =>
                      recipeMap.get(
                        id,
                      ),
                    )
                    .filter(
                      (
                        recipe,
                      ): recipe is NonNullable<
                        typeof recipe
                      > =>
                        Boolean(
                          recipe,
                        ),
                    );

                const renaming =
                  renameId ===
                  collection.id;

                const collectionBusy =
                  busyId ===
                  collection.id;

                return (
                  <article
                    key={
                      collection.id
                    }
                    className="collection-card"
                  >
                    <div className="collection-card-header">
                      <div className="collection-card-title">
                        {renaming ? (
                          <div className="collection-rename">
                            <input
                              type="text"
                              value={
                                renameValue
                              }
                              onChange={(
                                event,
                              ) =>
                                setRenameValue(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              onKeyDown={(
                                event,
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  event.preventDefault();

                                  void handleRename(
                                    collection.id,
                                  );
                                }

                                if (
                                  event.key ===
                                  "Escape"
                                ) {
                                  cancelRename();
                                }
                              }}
                              autoFocus
                              maxLength={
                                80
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                void handleRename(
                                  collection.id,
                                )
                              }
                              disabled={
                                collectionBusy ||
                                !renameValue.trim()
                              }
                            >
                              {t(
                                "common.save",
                                {
                                  defaultValue:
                                    "Save",
                                },
                              )}
                            </button>

                            <button
                              type="button"
                              className="collection-icon-button"
                              onClick={
                                cancelRename
                              }
                              aria-label={t(
                                "common.cancel",
                                {
                                  defaultValue:
                                    "Cancel",
                                },
                              )}
                            >
                              <X
                                size={
                                  16
                                }
                              />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h2>
                                {
                                  collection.name
                                }
                              </h2>

                              <p>
                                {
                                  collectionRecipes.length
                                }{" "}
                                {collectionRecipes.length ===
                                1
                                  ? t(
                                      "common.recipe",
                                      {
                                        defaultValue:
                                          "recipe",
                                      },
                                    )
                                  : t(
                                      "common.recipes",
                                      {
                                        defaultValue:
                                          "recipes",
                                      },
                                    )}
                              </p>
                            </div>

                            {!collection.archived && (
                              <button
                                type="button"
                                className="collection-icon-button"
                                onClick={() =>
                                  startRename(
                                    collection,
                                  )
                                }
                                aria-label={t(
                                  "collections.rename",
                                  {
                                    defaultValue:
                                      "Rename collection",
                                  },
                                )}
                              >
                                <Pencil
                                  size={
                                    16
                                  }
                                />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {!renaming && (
                        <div className="collection-card-actions">
                          {collection.archived ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleRestore(
                                  collection.id,
                                )
                              }
                              disabled={
                                collectionBusy
                              }
                            >
                              <RotateCcw
                                size={
                                  16
                                }
                              />

                              <span>
                                {t(
                                  "collections.restore",
                                  {
                                    defaultValue:
                                      "Restore",
                                  },
                                )}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                void handleArchive(
                                  collection.id,
                                )
                              }
                              disabled={
                                collectionBusy
                              }
                            >
                              <ArchiveIcon
                                size={
                                  16
                                }
                              />

                              <span>
                                {t(
                                  "collections.archive",
                                  {
                                    defaultValue:
                                      "Archive",
                                  },
                                )}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {collectionRecipes.length >
                    0 ? (
                      <div className="collection-recipe-list">
                        {collectionRecipes.map(
                          (
                            recipe,
                          ) => {
                            const removeBusy =
                              busyId ===
                              `${collection.id}:${recipe.id}`;

                            return (
                              <div
                                className="collection-recipe-item"
                                key={
                                  recipe.id
                                }
                              >
                                <Link
                                  to={`/recipe/${recipe.id}`}
                                  className="collection-recipe-link"
                                >
                                  <div className="collection-recipe-image">
                                    {recipe.image_url ? (
                                      <img
                                        src={
                                          recipe.image_url
                                        }
                                        alt={
                                          recipe.title
                                        }
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="collection-recipe-placeholder">
                                        <ChefHat
                                          size={
                                            22
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="collection-recipe-copy">
                                    <strong>
                                      {
                                        recipe.title
                                      }
                                    </strong>

                                    {recipe.category && (
                                      <span>
                                        {t(
                                          `categories.${recipe.category}`,
                                          {
                                            defaultValue:
                                              recipe.category,
                                          },
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </Link>

                                {!collection.archived && (
                                  <button
                                    type="button"
                                    className="collection-recipe-remove"
                                    onClick={() =>
                                      void handleRemoveRecipe(
                                        collection.id,
                                        recipe.id,
                                      )
                                    }
                                    disabled={
                                      removeBusy
                                    }
                                    aria-label={t(
                                      "collections.removeRecipe",
                                      {
                                        defaultValue:
                                          "Remove from collection",
                                      },
                                    )}
                                  >
                                    <X
                                      size={
                                        17
                                      }
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <div className="collection-card-empty">
                        <ChefHat
                          size={24}
                        />

                        <p>
                          {t(
                            "collections.collectionEmpty",
                            {
                              defaultValue:
                                "No recipes in this collection yet.",
                            },
                          )}
                        </p>

                        {!collection.archived && (
                          <Link to="/discover">
                            {t(
                              "collections.findRecipes",
                              {
                                defaultValue:
                                  "Find recipes",
                              },
                            )}

                            <ArrowRight
                              size={
                                15
                              }
                            />
                          </Link>
                        )}
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default CollectionsPage;