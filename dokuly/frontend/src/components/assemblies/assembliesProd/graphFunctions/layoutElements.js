import dagre from 'dagre';
import { isNode } from 'react-flow-renderer';

const getLayoutedElements = (elements, graph) => {
    graph.setGraph({rankdir:'TB'}); // TB - Top to Bottom, LR left to right etc.
    if(elements && elements.length !== 0) {
        elements.forEach(element => { 
            if(isNode(element)) {
                graph.setNode(element.id, {width: 170, height: 30});
            } else {
                graph.setEdge(element.target, element.source)
            }
        });
        dagre.layout(graph);
        return elements.map((el) => {
            if(isNode(el)) {
                const nodePosition = graph.node(el.id)
                el.sourcePosition = 'top';
                el.targetPosition = 'bottom';
                el.position = {
                    x: nodePosition.x - 100 / 2 + Math.random() / 1000,
                    y: nodePosition.y - 32 / 2,
                }
            }
            return el
        })
    } else {
        return []
    }
}

export default getLayoutedElements