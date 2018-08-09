import BlockElement from './BlockElement';
import NodeBlockElement from './NodeBlockElement';
import StartEndBlockElement from './StartEndBlockElement';
import collapseNodes from '../utils/collapseNodes';
import contains from '../utils/contains';
import getBlockContext from './getBlockContext';
import getTagOfNode from '../utils/getTagOfNode';
import isBlockElement from '../utils/isBlockElement';

/**
 * This produces a block element from a a node
 * It needs to account for various HTML structure. Examples:
 * 1) <ced><div>abc</div></ced>
 *   This is most common the case, user passes in a node pointing to abc, and get back a block representing <div>abc</div>
 * 2) <ced><p><br></p></ced>
 *   Common content for empty block for email client like OWA, user passes node pointing to <br>, and get back a block representing <p><br></p>
 * 3) <ced>abc</ced>
 *   Not common, but does happen. It is still a block in user's view. User passes in abc, and get back a start-end block representing abc
 *   NOTE: abc could be just one node. However, since it is not a html block, it is more appropriate to use start-end block although they point to same node
 * 4) <ced><div>abc<br>123</div></ced>
 *   A bit tricky, but can happen when user use Ctrl+Enter which simply inserts a <BR> to create a link break. There're two blocks:
 *   block1: 1) abc<br> block2: 123
 * 5) <ced><div>abc<div>123</div></div></ced>
 *   Nesting div and there is text node in same level as a DIV. Two blocks: 1) abc 2) <div>123</div>
 * 6) <ced<div>abc<span>123<br>456</span></div></ced>
 *   This is really tricky. Essentially there is a <BR> in middle of a span breaking the span into two blocks;
 *   block1: abc<span>123<br> block2: 456
 * In summary, given any arbitary node (leaf), to identify the head and tail of the block, following rules need to be followed:
 * 1) to identify the head, it needs to crawl DOM tre left/up till a block node or BR is encountered
 * 2) same for identifying tail
 * 3) should also apply a block ceiling, meaning as it crawls up, it should stop at a block node
 */
export default function getBlockElementAtNode(rootNode: Node, node: Node): BlockElement {
    if (!contains(rootNode, node)) {
        return null;
    }

    // Identify the containing block. This serves as ceiling for traversing down below
    // NOTE: this container block could be just the rootNode,
    // which cannot be used to create block element. We will special case handle it later on
    let containerBlockNode = getBlockContext(node);
    if (containerBlockNode == node) {
        return new NodeBlockElement(containerBlockNode);
    }

    // Find the head and leaf node in the block
    let headNode = findHeadTailLeafNode(node, containerBlockNode, false /*isTail*/);
    let tailNode = findHeadTailLeafNode(node, containerBlockNode, true /*isTail*/);

    // At this point, we have the head and tail of a block, here are some examples and where head and tail point to
    // 1) <ced><div>hello<br></div></ced>, head: hello, tail: <br>
    // 2) <ced><div>hello<span style="font-family: Arial">world</span></div></ced>, head: hello, tail: world
    // Both are actually completely and exclusively wrapped in a parent div, and can be represented with a Node block
    // So we shall try to collapse as much as we can to the nearest common ancester
    let nodes = collapseNodes(rootNode, headNode, tailNode, false /*canSplitParent*/);
    headNode = nodes[0];
    tailNode = nodes[nodes.length - 1];

    if (headNode.parentNode != tailNode.parentNode) {
        // Un-balanced start and end, create a start-end block
        return new StartEndBlockElement(rootNode, headNode, tailNode);
    } else {
        // Balanced start and end (point to same parent), need to see if further collapsing can be done
        while (!headNode.previousSibling && !tailNode.nextSibling) {
            let parentNode = headNode.parentNode;
            if (parentNode == containerBlockNode) {
                // Has reached the container block
                if (containerBlockNode != rootNode) {
                    // If the container block is not the root, use the container block
                    headNode = tailNode = parentNode;
                }
                break;
            } else {
                // Continue collapsing to parent
                headNode = tailNode = parentNode;
            }
        }

        // If head and tail are same and it is a block element, create NodeBlock, otherwise start-end block
        return headNode == tailNode && isBlockElement(headNode)
            ? new NodeBlockElement(headNode as HTMLElement)
            : new StartEndBlockElement(rootNode, headNode, tailNode);
    }
}

/**
 * Given a node and container block, identify the first/last leaf node
 * A leaf node is defined as deepest first/last node in a block
 * i.e. <div><span style="font-family: Arial">abc</span></div>, abc is the head leaf of the block
 * Often <br> or a child <div> is used to create a block. In that case, the leaf after the sibling div or br should be the head leaf
 * i.e. <div>123<br>abc</div>, abc is the head of a block because of a previous sibling <br>
 * i.e. <div><div>123</div>abc</div>, abc is also the head of a block because of a previous sibling <div>
 */
function findHeadTailLeafNode(node: Node, containerBlockNode: Node, isTail: boolean): Node {
    let result = node;
    while (result) {
        let sibling = node;
        while (!(sibling = isTail ? node.nextSibling : node.previousSibling)) {
            node = node.parentNode;
            if (node == containerBlockNode) {
                return result;
            }
        }

        while (sibling) {
            if (isBlockElement(sibling)) {
                return result;
            } else if (getTagOfNode(sibling) == 'BR') {
                return isTail ? sibling : result;
            }

            node = sibling;
            sibling = isTail ? node.firstChild : node.lastChild;
        }

        result = node;
    }
    return result;
}
