import InlineElement from './InlineElement';
import getInlineElementAtNode from './getInlineElementAtNode';
import { getFirstLeafNode, getLastLeafNode } from '../utils/getLeafNode';

/**
 * Get first inline element
 */
export function getFirstInlineElement(rootNode: Node): InlineElement {
    // getFirstLeafNode can return null for empty container
    // do check null before passing on to get inline from the node
    let node = getFirstLeafNode(rootNode);
    return node ? getInlineElementAtNode(rootNode, node) : null;
}

/**
 * Get last inline element
 */
export function getLastInlineElement(rootNode: Node): InlineElement {
    // getLastLeafNode can return null for empty container
    // do check null before passing on to get inline from the node
    let node = getLastLeafNode(rootNode);
    return node ? getInlineElementAtNode(rootNode, node) : null;
}
