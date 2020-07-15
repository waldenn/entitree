import React, { useContext, useState, useRef, useEffect } from "react";
import useDebounce from "../../lib/useDebounce";
import "./SearchBar.scss";
import {
  Form,
  Spinner,
  Button,
  Dropdown,
  Container,
  InputGroup,
  Tooltip,
  Overlay,
} from "react-bootstrap";
import qs from "query-string";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import {
  FAMILY_PROP,
  FAMILY_IDS_MAP,
  CHILD_ID,
} from "../../constants/properties";
import { AppContext } from "../../App";
import getItem from "../../wikidata/getItem";
import getItemProps from "../../wikidata/getItemProps";
import search from "../../wikidata/search";
import slugs from "../../sitemap/slugs.json";
import { DEFAULT_LANG } from "../../constants/langs";
import getWikipediaArticle from "../../wikipedia/getWikipediaArticle";

export default function SearchBar() {
  const {
    currentLang,
    showError,
    hasLanguageChanged,
    setCurrentEntity,
    setCurrentProp,
    currentProp,
    currentEntity,
    setLoadingEntity,
    loadingEntity,
  } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProps, setLoadingProps] = useState(false);
  const [loadingProp, setLoadingProp] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState();
  const [fromKeyboard, setFromKeyboard] = useState(true);
  const [availableProps, setAvailableProps] = useState([]);

  //Check on mount if there are params in the url
  const location = useLocation();
  const match = useRouteMatch();
  useEffect(() => {
    (async () => {
      try {
        let itemId;
        if (match.params.itemSlug) {
          if (match.params.itemSlug.match(/^Q\d+$/)) {
            itemId = match.params.itemSlug;
          } else {
            const slugItem = slugs[match.params.itemSlug];
            if (slugItem) {
              itemId = slugItem.id;
            } else {
              const {
                data: { wikibase_item },
              } = await getWikipediaArticle(
                match.params.itemSlug,
                currentLang.code
              );
              if (wikibase_item) itemId = wikibase_item;
            }
          }
        }

        loadEntity(itemId, match.params.propSlug);
      } catch (error) {
        showError(error);
      }
    })();
  }, []);

  //reload entity on lang change
  useEffect(() => {
    if (hasLanguageChanged) {
      (async () => {
        try {
          if (currentEntity)
            await loadEntity(
              currentEntity.id,
              null,
              currentProp ? currentProp.id : null //this doesn't work if I switch language
            );
        } catch (error) {
          showError(error);
        }
      })();
    }
  }, [hasLanguageChanged]);

  const loadEntity = async (_currentEntityId, propSlug, propId) => {
    try {
      if (_currentEntityId) {
        if (currentEntity && _currentEntityId !== currentEntity.id)
          setCurrentEntity(null); //avoids weird caching behaviour, get a fresh one

        setFromKeyboard(false);
        setLoadingEntity(true);
        setLoadingProps(true);

        let [_currentEntity, itemProps] = await Promise.all([
          getItem(_currentEntityId, currentLang.code),
          getItemProps(_currentEntityId, currentLang.code),
        ]);

        itemProps.forEach((prop) => {
          prop.slug = prop.label.replace(/\s/g, "_");
        });

        let _currentProp;
        if (propSlug) {
          _currentProp = itemProps.find(({ slug }) => slug === propSlug);
        }
        if (propId) {
          _currentProp = itemProps.find(({ id }) => id === propId);
        }

        //currentProp belongs to family stuff
        if (itemProps.some((prop) => FAMILY_IDS_MAP[prop.id])) {
          //Remove all family-related props in favour of the custom
          itemProps = itemProps.filter((prop) => {
            return !FAMILY_IDS_MAP[prop.id];
          });

          const translatedFamilyTree = FAMILY_PROP.labels[currentLang.code];
          if (translatedFamilyTree) FAMILY_PROP.label = translatedFamilyTree;

          //Add the Family tree fav currentProp
          itemProps = [FAMILY_PROP].concat(itemProps);

          //Select the family tree if no other currentProp is selected, or if it's a family currentProp
          if (!_currentProp || FAMILY_IDS_MAP[_currentProp.id]) {
            setCurrentProp(FAMILY_PROP);
          } else {
            setCurrentProp(_currentProp);
          }
        } else {
          setCurrentProp(_currentProp);
        }
        setAvailableProps(itemProps);
        //Set here (short setCurrentProp) otherwise if there is a delay between entity and props graph will be called twice
        setCurrentEntity(_currentEntity);
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoadingEntity(false);
      setLoadingProps(false);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    if (debouncedSearchTerm && fromKeyboard) {
      setShowSuggestions(true);
      setLoadingSuggestions(true);
      search(debouncedSearchTerm, currentLang.code).then(
        ({ data: { search: searchResults } }) => {
          searchResults = searchResults.filter(({ id, description }) => {
            //remove current entity from results
            if (currentEntity && id === currentEntity.id) {
              return false;
            }

            //remove wikimedia disam pages
            if (
              currentLang.disambPageDesc &&
              description === currentLang.disambPageDesc
            )
              return false;

            return true;
          });
          setLoadingSuggestions(false);
          setSearchResults(searchResults);
        }
      );
    } else {
      setLoadingSuggestions(false);
      setShowSuggestions(false);
    }
  }, [debouncedSearchTerm]);

  const history = useHistory();
  useEffect(() => {
    if (currentEntity) {
      setSearchTerm(currentEntity.label); //if updates from graph (recenter)
      const params = {};

      if (currentLang.code !== DEFAULT_LANG.code)
        params.lang = currentLang.code;
      const searchString = qs.stringify(params);

      history.push({
        pathname: `/${currentProp ? currentProp.slug : "all"}/${
          currentEntity.wikipediaSlug
            ? currentEntity.wikipediaSlug
            : currentEntity.id
        }`,
        search: "?" + searchString,
      });
    }
  }, [currentEntity, currentProp]);

  const propToggleRef = useRef();
  return (
    <Form
      className="SearchBar"
      onSubmit={(e) => {
        e.preventDefault();
        setShowSuggestions(true);
      }}
    >
      <Container>
        <Form.Group className="searchBox" controlId="searchBox">
          <InputGroup>
            <Form.Control
              onKeyDown={() => setFromKeyboard(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              value={
                loadingEntity
                  ? "Loading entity..."
                  : searchTerm
                  ? searchTerm
                  : ""
              }
              type="search"
              readOnly={loadingEntity}
              placeholder="Start typing to search..."
              autoComplete="off"
            />
            {currentEntity && (
              <InputGroup.Append>
                <Dropdown>
                  <Overlay
                    placement={"bottom"}
                    show={false}
                    target={propToggleRef.current}
                  >
                    <Tooltip>Select a property to show a tree</Tooltip>
                  </Overlay>
                  <Dropdown.Toggle
                    disabled={loadingProps}
                    variant="none"
                    ref={propToggleRef}
                    id="dropdown-props"
                    className={
                      currentEntity &&
                      !currentProp &&
                      "shouldSelectProp btn-warning"
                    }
                  >
                    {loadingProps
                      ? "loading props..."
                      : currentProp
                      ? currentProp.label
                      : "Choose a property "}
                  </Dropdown.Toggle>

                  <Dropdown.Menu alignRight>
                    {availableProps.map((prop) => (
                      <Dropdown.Item
                        key={prop.id}
                        className={prop.isFav ? "fav" : ""}
                        onClick={() => setCurrentProp(prop)}
                      >
                        {prop.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </InputGroup.Append>
            )}
          </InputGroup>
          {showSuggestions && (
            <Suggestions
              loadingSuggestions={loadingSuggestions}
              searchResults={searchResults}
              loadEntity={loadEntity}
              setShowSuggestions={setShowSuggestions}
            />
          )}
        </Form.Group>
      </Container>
    </Form>
  );
}

function Suggestions({
  loadingSuggestions,
  searchResults,
  loadEntity,
  setShowSuggestions,
}) {
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="Suggestions dropdown-menu show d-relative">
      {loadingSuggestions && (
        <div className="searchingMessage">
          <Spinner animation="border" variant="secondary" /> Searching
        </div>
      )}
      {!loadingSuggestions && !searchResults.length && (
        <div className="searchingMessage">Sorry, no results found</div>
      )}
      {searchResults.map((result) => (
        <Button
          key={result.id}
          className="searchResultBtn"
          variant="light"
          onClick={() => {
            loadEntity(result.id);
            setShowSuggestions(false);
          }}
        >
          <b>{result.label}</b>
          {result.description && <i>{result.description}</i>}
        </Button>
      ))}
    </div>
  );
}
