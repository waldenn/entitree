import "./Graph.scss";
import { TransformWrapper } from "react-zoom-pan-pinch";
import { AppContext } from "../../App";
import React, {
  useReducer,
  useContext,
  useRef,
  useEffect,
  useState,
  memo,
} from "react";
import { TransformComponent } from "react-zoom-pan-pinch";
import getItems from "../../wikidata/getItems";
import { hierarchy } from "d3-hierarchy";
import {
  CARD_WIDTH,
  SIBLING_SPOUSE_SEPARATION,
  MAX_SCALE,
  MIN_SCALE,
  DEFAULT_SCALE,
} from "../../constants/tree";
import Node from "../Node/Node";
import Rel from "../Rel/Rel";
import { CHILD_ID } from "../../constants/properties";
import graphReducer, { initialState } from "./graphReducer";
import getNodeUniqueId from "../../lib/getNodeUniqueId";
import filterSpouses from "../../lib/filterSpouses";
import addEntityConnectors from "../../lib/addEntityConnectors";
import getUpMap from "../../wikidata/getUpMap";
import Navigation from "./Navigation/Navigation";
import sortByBirthDate from "../../lib/sortByBirthDate";
import last from "../../lib/last";

export default function GraphWrapper() {
  const { showGenderColor, showNavIcons, showBirthName, showFace } = useContext(
    AppContext
  );
  return (
    <div
      className={`GraphWrapper ${showGenderColor ? "showGenderColor" : ""} ${
        showNavIcons ? "showNavIcons" : ""
      } ${showBirthName ? "showBirthName" : ""} ${showFace ? "showFace" : ""}`}
    >
      <TransformWrapper
        zoomIn={{ step: 20 }}
        zoomOut={{ step: 20 }}
        wheel={{ step: 25 }}
        defaultScale={DEFAULT_SCALE}
        options={{
          limitToBounds: false,
          minScale: MIN_SCALE,
          maxScale: MAX_SCALE,
        }}
      >
        {(props) => <Graph {...props} />}
      </TransformWrapper>
    </div>
  );
}

const Graph = memo(
  function ({ setTransform, zoomIn, zoomOut, scale: currentScale, ...props }) {
    const {
      showError,
      currentLang,
      currentEntity,
      currentProp,
      setCurrentEntity,
      setLoadingEntity,
    } = useContext(AppContext);

    const [graph, dispatchGraph] = useReducer(graphReducer, initialState);
    const [focusedNode, setFocusedNode] = useState();

    const graphRef = useRef();
    const [graphWidth, setGraphWidth] = useState(0);
    const [graphHeight, setGraphHeight] = useState(0);
    const upMap = useRef();

    useEffect(() => {
      const handleResize = () => {
        setGraphWidth(graphRef.current.offsetWidth);
        setGraphHeight(graphRef.current.offsetHeight);
      };
      handleResize();

      window.addEventListener("resize", handleResize); //debounce this

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [graphRef]);

    //GET ROOT
    useEffect(() => {
      //also wait until the container size has been set
      if (currentEntity && graphWidth) {
        (async () => {
          try {
            let root;
            //property has been selected/changed from dropdown or is available from url
            if (currentProp) {
              //show "loading tree" spinner a bit more
              setLoadingEntity(true);
              upMap.current = await getUpMap(currentEntity.id, currentProp.id);
              const rootItem = addEntityConnectors(
                currentEntity,
                currentProp.id,
                {
                  upMap: upMap.current,
                  addDownIds: true,
                  addRightIds: currentProp.id === CHILD_ID,
                  addLeftIds: currentProp.id === CHILD_ID,
                }
              );
              root = hierarchy(rootItem);
              const rootId = getNodeUniqueId(root, 0);
              root.treeId = rootId;
              root.isRoot = true;
              root.x = 0;
              root.y = 0;

              //annoyingly a repetition but correct in order to have separate trees
              let childTree = hierarchy(rootItem);
              childTree.treeId = rootId;
              childTree.isRoot = true;
              childTree.x = 0;
              childTree.y = 0;

              let parentTree = hierarchy(rootItem);
              parentTree.treeId = rootId;
              parentTree.isRoot = true;
              parentTree.x = 0;
              parentTree.y = 0;

              dispatchGraph({
                type: "set",
                root,
                childTree,
                parentTree,
              });

              toggleParents(parentTree, { noRecenter: true });
              toggleChildren(childTree, { noRecenter: true });
              toggleRootSiblings(root, { noRecenter: true });
              toggleRootSpouses(root, { noRecenter: true });

              setLoadingEntity(false);
            } else {
              //currentEntity has changed from searchBox
              root = hierarchy(currentEntity);
              root.treeId = getNodeUniqueId(root, 0);
              dispatchGraph({
                type: "set",
                root,
              });
            }

            setFocusedNode(root);
            centerPoint(0, 0);
          } catch (error) {
            showError(error);
          }
        })();
      }
    }, [currentEntity, currentProp, graphWidth]);

    const toggleChildren = async (node, options = {}) => {
      if (!node.data.downIds || !node.data.downIds.length) return;

      dispatchGraph({ type: "setLoadingChildren", node });

      if (node._childrenExpanded) {
        dispatchGraph({ type: "collapseChildren", node });
      } else if (node._children) {
        //has cached data
        node.children = node._children;
        node._children = null;
        dispatchGraph({ type: "expandChildren", node });
      } else {
        try {
          const entities = await getItems(
            node.data.downIds,
            currentLang.code,
            currentProp.id,
            {
              addDownIds: true,
              addRightIds: currentProp.id === CHILD_ID,
            }
          );

          sortByBirthDate(entities);
          entities.forEach((entity, index) => {
            const childNode = hierarchy(entity);
            childNode.depth = node.depth + 1;
            childNode.parent = node;
            childNode.treeId = getNodeUniqueId(childNode, index);
            childNode.isChild = true;
            if (!node.children) {
              node.children = [];
            }
            node.children.push(childNode);
          });

          dispatchGraph({ type: "expandChildren", node });
        } catch (error) {
          showError(error);
        }
      }
      if (!options.noRecenter) centerPoint(node.x, node.y);
    };

    const toggleParents = async (node, options = {}) => {
      if (!node.data.upIds || !node.data.upIds.length) return;

      dispatchGraph({ type: "setLoadingParents", node });

      if (node._parentsExpanded) {
        dispatchGraph({ type: "collapseParents", node });
      } else if (node._parents) {
        //has cached data
        node.children = node._parents;
        node._parents = null;
        dispatchGraph({ type: "expandParents", node });
      } else {
        try {
          const entities = await getItems(
            node.data.upIds,
            currentLang.code,
            currentProp.id,
            {
              upMap: upMap.current,
              addLeftIds: currentProp.id === CHILD_ID,
              addRightIds: currentProp.id === CHILD_ID,
            }
          );

          entities.forEach((entity, index) => {
            const parentNode = hierarchy(entity);
            parentNode.isParent = true;
            parentNode.depth = node.depth - 1;
            parentNode.parent = node;
            parentNode.treeId = getNodeUniqueId(parentNode, index);
            if (!node.children) {
              node.children = [];
            }
            node.children.push(parentNode);
          });
          if (currentProp.id === CHILD_ID) {
            filterSpouses(node);
          }
          dispatchGraph({ type: "expandParents", node });
        } catch (error) {
          showError(error);
        }
      }

      if (!options.noRecenter) centerPoint(node.x, node.y);
    };

    const toggleSpouses = async (node, options = {}) => {
      if (!node.data.rightIds || !node.data.rightIds.length) return;

      dispatchGraph({ type: "setLoadingSpouses", node });

      let lastSpouse;
      if (node._spousesExpanded) {
        dispatchGraph({ type: "collapseSpouses", node });
      } else if (node._spouses) {
        //cached
        lastSpouse = last(node._spouses);
        dispatchGraph({ type: "expandSpouses", node });
      } else {
        try {
          const entities = await getItems(node.data.rightIds, currentLang.code);
          entities.forEach((entity, index) => {
            const spouseNode = getSpouseNode(entity);
            spouseNode.depth = node.depth;
            spouseNode.virtualParent = node;
            spouseNode.parent = node.parent;
            const spouseIndex = node.parent.children.indexOf(node) + 1 + index; //need to be appended to the list
            node.parent.children.splice(spouseIndex, 0, spouseNode);
            lastSpouse = spouseNode;
          });
          dispatchGraph({ type: "expandSpouses", node });
        } catch (error) {
          showError(error);
        }
      }

      let newx = node.x;
      if (node._spousesExpanded && lastSpouse) {
        newx = (newx + lastSpouse.x) / 2;
      }
      if (!options.noRecenter) centerPoint(newx);
    };

    const toggleSiblings = async (node, options = {}) => {
      if (!node.data.leftIds || !node.data.leftIds.length) return;

      dispatchGraph({ type: "setLoadingSiblings", node });

      let firstSibling;
      if (node._siblingsExpanded) {
        dispatchGraph({ type: "collapseSiblings", node });
      } else if (node._siblings) {
        firstSibling = node._siblings[0];
        dispatchGraph({ type: "expandSiblings", node });
      } else {
        try {
          const entities = await getItems(node.data.leftIds, currentLang.code);
          sortByBirthDate(entities);
          entities.forEach((entity, index) => {
            const siblingNode = getSiblingNode(entity, index);
            siblingNode.depth = node.depth;
            siblingNode.virtualParent = node;
            siblingNode.parent = node.parent;
            const siblingIndex = node.parent.children.indexOf(node); //it will keep prepending to the node index
            node.parent.children.splice(siblingIndex, 0, siblingNode);
            if (!firstSibling) firstSibling = siblingNode;
          });
          dispatchGraph({ type: "expandSiblings", node });
        } catch (error) {
          showError(error);
        }
      }

      let newx = node.x;
      if (node._siblingsExpanded && firstSibling)
        newx = (newx + firstSibling.x) / 2;
      if (!options.noRecenter) centerPoint(newx);
    };

    const toggleRootSpouses = async (root, options = {}) => {
      if (!root.data.rightIds || !root.data.rightIds.length) return;

      dispatchGraph({ type: "setLoadingSpouses", node: root });

      if (root._spousesExpanded) {
        dispatchGraph({ type: "collapseRootSpouses", root });
      } else if (root._spouses) {
        dispatchGraph({ type: "expandRootSpouses", root });
      } else {
        try {
          const entities = await getItems(root.data.rightIds, currentLang.code);
          const baseX = CARD_WIDTH * SIBLING_SPOUSE_SEPARATION;
          entities.forEach((entity, index) => {
            const spouseNode = getSpouseNode(entity);
            spouseNode.x = baseX + baseX * index;
            spouseNode.y = 0;
            spouseNode.depth = 0;
            spouseNode.parent = root;
            if (!root.spouses) root.spouses = [];
            root.spouses.push(spouseNode);
          });
          dispatchGraph({ type: "expandRootSpouses", root });
        } catch (error) {
          showError(error);
        }
      }

      let newx = root.x;
      if (root.spouses)
        newx = (newx + root.spouses[root.spouses.length - 1].x) / 2;
      if (!options.noRecenter) centerPoint(newx);
    };

    const toggleRootSiblings = async (root, options = {}) => {
      if (!root.data.leftIds || !root.data.leftIds.length) return;

      dispatchGraph({ type: "setLoadingSiblings", node: root });

      if (root._siblingsExpanded) {
        dispatchGraph({ type: "collapseRootSiblings", root });
      } else if (root._siblings) {
        dispatchGraph({ type: "expandRootSiblings", root });
      } else {
        try {
          const entities = await getItems(root.data.leftIds, currentLang.code);
          const baseX = -(CARD_WIDTH * SIBLING_SPOUSE_SEPARATION);
          sortByBirthDate(entities);
          entities.forEach((entity, index, { length }) => {
            const siblingNode = getSiblingNode(entity, index);
            siblingNode.x = baseX * (length - index);
            siblingNode.y = 0;
            if (!root.siblings) root.siblings = [];
            root.siblings.push(siblingNode);
          });
          dispatchGraph({ type: "expandRootSiblings", root });
        } catch (error) {
          showError(error);
        }
      }

      let newx = root.x;
      if (root.siblings) newx = (newx + root.siblings[0].x) / 2;
      if (!options.noRecenter) centerPoint(newx);
    };

    const getSiblingNode = (entity, index) => {
      const siblingNode = hierarchy(entity);
      siblingNode.isSibling = true;
      siblingNode.treeId = getNodeUniqueId(siblingNode, index, "sibling");
      return siblingNode;
    };

    const getSpouseNode = (entity, index) => {
      const spouseNode = hierarchy(entity);
      spouseNode.isSpouse = true;
      spouseNode.treeId = getNodeUniqueId(spouseNode, index, "spouse");
      return spouseNode;
    };

    const fitTree = () => {
      const leftEdge = graph.maxLeft - CARD_WIDTH; //should be CARD_WIDTH / 2 but give some padding
      const topEdge = graph.maxTop - CARD_WIDTH / 2;
      const rightEdge = graph.maxRight + CARD_WIDTH;
      const bottomEdge = graph.maxBottom + CARD_WIDTH / 2;
      const treeWidth = rightEdge - leftEdge;
      const treeHeight = bottomEdge - topEdge;

      let nextScale;
      if (graphWidth - treeWidth < graphHeight - treeHeight) {
        nextScale = graphWidth / treeWidth;
      } else {
        nextScale = graphHeight / treeHeight;
      }
      if (nextScale > MAX_SCALE) nextScale = MAX_SCALE;

      const centerX = leftEdge + treeWidth / 2;
      const centerY = topEdge + treeHeight / 2;

      centerPoint(centerX, centerY, nextScale);
    };

    const centerPoint = (x, y, scale = currentScale) => {
      const halfWidth = graphWidth / 2;
      const calculatedPositionX = halfWidth - (halfWidth + x) * scale;
      let calculatedPositionY = y;
      if (!isNaN(y)) {
        const halfHeight = graphHeight / 2;
        calculatedPositionY = halfHeight - (halfHeight + y) * scale;
      }
      setTransform(calculatedPositionX, calculatedPositionY, scale);
    };

    const reloadTreeFromFocused = () => {
      if (focusedNode.treeId !== root.treeId)
        setCurrentEntity(focusedNode.data);
      else centerPoint(focusedNode.x, focusedNode.y);
    };

    const recenter = () => {
      centerPoint(focusedNode.x, focusedNode.y);
    };

    const {
      root,
      childTree,
      parentTree,
      containerStyle,
      parentNodes,
      childNodes,
      parentRels,
      childRels,
    } = graph;

    return (
      <div className="Graph" ref={graphRef}>
        <TransformComponent>
          <div className="center">
            <svg className="svgContainer" style={containerStyle}>
              <g
                transform={`translate(${containerStyle.width / 2} ${
                  containerStyle.height / 2
                })`}
              >
                <g className="rels">
                  {childRels.map((rel) => (
                    <Rel
                      key={rel.source.treeId + rel.target.treeId}
                      rel={rel}
                    />
                  ))}
                  {parentRels.map((rel) => (
                    <Rel
                      key={rel.source.treeId + rel.target.treeId}
                      rel={rel}
                    />
                  ))}
                  {root &&
                    root.spouses &&
                    root.spouses.map((target) => {
                      return (
                        <Rel
                          key={"root" + target.treeId}
                          rel={{ source: root, target }}
                        />
                      );
                    })}
                  {root &&
                    root.siblings &&
                    root.siblings.map((target) => (
                      <Rel
                        key={"root" + target.treeId}
                        rel={{ source: root, target }}
                      />
                    ))}
                </g>
              </g>
            </svg>
            <div style={containerStyle}>
              <div
                style={{
                  position: "absolute",
                  left: containerStyle.width / 2,
                  top: containerStyle.height / 2,
                }}
              >
                <div className="nodes">
                  {root &&
                    root.siblings &&
                    root.siblings.map((node) => (
                      <Node
                        key={node.treeId}
                        node={node}
                        setFocusedNode={setFocusedNode}
                        focusedNode={focusedNode}
                      />
                    ))}
                  {root && (
                    <Node
                      currentProp={currentProp}
                      toggleChildren={() => {
                        toggleChildren(childTree);
                      }}
                      toggleParents={() => {
                        toggleParents(parentTree);
                      }}
                      toggleSpouses={() => {
                        toggleRootSpouses(root);
                      }}
                      toggleSiblings={() => {
                        toggleRootSiblings(root);
                      }}
                      node={root}
                      setFocusedNode={setFocusedNode}
                      focusedNode={focusedNode}
                    />
                  )}
                  {root &&
                    root.spouses &&
                    root.spouses.map((node) => (
                      <Node
                        key={node.treeId}
                        node={node}
                        setFocusedNode={setFocusedNode}
                        focusedNode={focusedNode}
                      />
                    ))}
                  {childNodes.map((node, index) => (
                    <Node
                      index={index}
                      key={node.treeId}
                      currentProp={currentProp}
                      reloadTreeFromFocused={reloadTreeFromFocused}
                      toggleChildren={(node) => {
                        toggleChildren(node);
                      }}
                      toggleSpouses={(node) => {
                        toggleSpouses(node);
                      }}
                      toggleSiblings={(node) => {
                        toggleSiblings(node);
                      }}
                      node={node}
                      setFocusedNode={setFocusedNode}
                      focusedNode={focusedNode}
                    />
                  ))}
                  {parentNodes.map((node, index) => (
                    <Node
                      key={node.treeId}
                      index={index}
                      currentProp={currentProp}
                      reloadTreeFromFocused={reloadTreeFromFocused}
                      toggleSpouses={(node) => {
                        toggleSpouses(node);
                      }}
                      toggleSiblings={(node) => {
                        toggleSiblings(node);
                      }}
                      toggleParents={(node) => {
                        toggleParents(node);
                      }}
                      node={node}
                      setFocusedNode={setFocusedNode}
                      focusedNode={focusedNode}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TransformComponent>
        <Navigation
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          focusedNode={focusedNode}
          recenter={recenter}
          fitTree={fitTree}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    //return prevProps.scale === nextProps.scale;
    return true; //better performance but inconsistent scale
  }
);
