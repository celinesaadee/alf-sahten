import {
  Check,
  FolderPlus,
  Plus,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  addRecipeToCollection,
  createCollectionWithRecipe,
  getCollections,
  getRecipeCollectionIds,
  removeRecipeFromCollection,
  type RecipeCollection,
} from "../services/collections";

type CollectionPickerProps = {
  recipeId: string;
};

export function CollectionPicker({
  recipeId,
}: CollectionPickerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [open, setOpen] =
    useState(false);

  const [
    collections,
    setCollections,
  ] = useState<
    RecipeCollection[]
  >([]);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    savingId,
    setSavingId,
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
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [
          collectionRows,
          recipeCollectionIds,
        ] = await Promise.all([
          getCollections(),
          getRecipeCollectionIds(
            recipeId,
          ),
        ]);

        if (cancelled) {
          return;
        }

        setCollections(
          collectionRows,
        );

        setSelectedIds(
          new Set(
            recipeCollectionIds,
          ),
        );
      } catch (err) {
        console.error(err);

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
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    recipeId,
    t,
    user,
  ]);

  async function handleToggle(
    collectionId: string,
  ) {
    if (savingId) {
      return;
    }

    const alreadyAdded =
      selectedIds.has(
        collectionId,
      );

    try {
      setSavingId(
        collectionId,
      );

      setError(null);

      if (alreadyAdded) {
        await removeRecipeFromCollection(
          collectionId,
          recipeId,
        );
      } else {
        await addRecipeToCollection(
          collectionId,
          recipeId,
        );
      }

      setSelectedIds(
        (current) => {
          const next =
            new Set(current);

          if (alreadyAdded) {
            next.delete(
              collectionId,
            );
          } else {
            next.add(
              collectionId,
            );
          }

          return next;
        },
      );
    } catch (err) {
      console.error(err);

      setError(
        t(
          "collections.updateError",
          {
            defaultValue:
              "Could not update this collection.",
          },
        ),
      );
    } finally {
      setSavingId(null);
    }
  }

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

      const collection =
        await createCollectionWithRecipe(
          cleanName,
          recipeId,
        );

      setCollections(
        (current) => [
          collection,
          ...current,
        ],
      );

      setSelectedIds(
        (current) => {
          const next =
            new Set(current);

          next.add(
            collection.id,
          );

          return next;
        },
      );

      setNewName("");
    } catch (err) {
      console.error(err);

      setError(
        t(
          "collections.createError",
          {
            defaultValue:
              "Could not create the collection.",
          },
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="collection-picker"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        className="collection-picker-trigger"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        aria-expanded={open}
      >
        <FolderPlus
          size={17}
        />

        <span>
          {t(
            "collections.saveToCollection",
            {
              defaultValue:
                "Add to collection",
            },
          )}
        </span>
      </button>

      {open && (
        <div
          className="collection-picker-panel"
          role="dialog"
          aria-label={t(
            "collections.saveToCollection",
            {
              defaultValue:
                "Add to collection",
            },
          )}
        >
          <div className="collection-picker-header">
            <div>
              <p className="collection-picker-kicker">
                {t(
                  "collections.privateKicker",
                  {
                    defaultValue:
                      "Private to you",
                  },
                )}
              </p>

              <h3>
                {t(
                  "collections.chooseCollection",
                  {
                    defaultValue:
                      "Choose a collection",
                  },
                )}
              </h3>
            </div>

            <button
              type="button"
              className="collection-picker-close"
              onClick={() =>
                setOpen(false)
              }
              aria-label={t(
                "common.close",
                {
                  defaultValue:
                    "Close",
                },
              )}
            >
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <p className="collection-picker-status">
              {t(
                "collections.loading",
                {
                  defaultValue:
                    "Loading collections...",
                },
              )}
            </p>
          ) : (
            <>
              {collections.length >
              0 ? (
                <div className="collection-picker-list">
                  {collections.map(
                    (
                      collection,
                    ) => {
                      const selected =
                        selectedIds.has(
                          collection.id,
                        );

                      const saving =
                        savingId ===
                        collection.id;

                      return (
                        <button
                          key={
                            collection.id
                          }
                          type="button"
                          className={`collection-picker-option${
                            selected
                              ? " is-selected"
                              : ""
                          }`}
                          onClick={() =>
                            void handleToggle(
                              collection.id,
                            )
                          }
                          disabled={
                            Boolean(
                              savingId,
                            )
                          }
                        >
                          <span className="collection-picker-option-copy">
                            <strong>
                              {
                                collection.name
                              }
                            </strong>

                            <span>
                              {saving
                                ? t(
                                    "collections.saving",
                                    {
                                      defaultValue:
                                        "Saving...",
                                    },
                                  )
                                : selected
                                  ? t(
                                      "collections.added",
                                      {
                                        defaultValue:
                                          "Added",
                                      },
                                    )
                                  : t(
                                      "collections.add",
                                      {
                                        defaultValue:
                                          "Add",
                                      },
                                    )}
                            </span>
                          </span>

                          <span
                            className={`collection-picker-check${
                              selected
                                ? " is-visible"
                                : ""
                            }`}
                          >
                            <Check
                              size={
                                16
                              }
                            />
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <p className="collection-picker-status">
                  {t(
                    "collections.noCollections",
                    {
                      defaultValue:
                        "You don't have any collections yet.",
                    },
                  )}
                </p>
              )}

              <div className="collection-picker-create">
                <label
                  htmlFor={`collection-name-${recipeId}`}
                >
                  {t(
                    "collections.newCollection",
                    {
                      defaultValue:
                        "New collection",
                    },
                  )}
                </label>

                <div className="collection-picker-create-row">
                  <input
                    id={`collection-name-${recipeId}`}
                    type="text"
                    value={newName}
                    onChange={(
                      event,
                    ) =>
                      setNewName(
                        event.target
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

                        void handleCreate();
                      }
                    }}
                    placeholder={t(
                      "collections.namePlaceholder",
                      {
                        defaultValue:
                          "e.g. Family favourites",
                      },
                    )}
                    maxLength={80}
                  />

                  <button
                    type="button"
                    className="collection-picker-create-button"
                    onClick={() =>
                      void handleCreate()
                    }
                    disabled={
                      creating ||
                      !newName.trim()
                    }
                  >
                    <Plus
                      size={17}
                    />

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
                            "collections.createAndAdd",
                            {
                              defaultValue:
                                "Create",
                            },
                          )}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <p
              className="collection-picker-error"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}