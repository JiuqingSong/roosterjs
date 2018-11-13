import EmptyInlineElement from '../inlineElements/EmptyInlineElement';
import getBlockElementAtNode from '../blockElements/getBlockElementAtNode';
import getInlineElementAtNode from '../inlineElements/getInlineElementAtNode';
import getInlineElementBeforeAfter from '../inlineElements/getInlineElementBeforeAfter';
import Position from '../selection/Position';
import TraversingScoper from './TraversingScoper';
import { BlockElement, ContentPosition, InlineElement, NodePosition } from 'roosterjs-editor-types';
import { getFirstLeafNode, getLastLeafNode } from '../utils/getLeafNode';

/**
 * This provides traversing content in a selection start block
 * This is commonly used for those cursor context sensitive plugin,
 * they want to know text being typed at cursor
 * This provides a scope for parsing from cursor position up to begin of the selection block
 */
export default class SelectionBlockScoper implements TraversingScoper {
    private block: BlockElement;
    private position: NodePosition;

    /**
     * Create a new instance of SelectionBlockScoper class
     * @param rootNode The root node of the whole scope
     * @param position Position of the selection start
     * @param startFrom Where to start, can be Begin, End, SelectionStart
     */
    constructor(
        public rootNode: Node,
        position: NodePosition | Range,
        private startFrom: ContentPosition
    ) {
        position = position instanceof Range ? Position.getStart(position) : position;
        this.position = position.normalize();
        this.block = getBlockElementAtNode(this.rootNode, this.position.node);
    }

    /**
     * Get the start block element
     */
    public getStartBlockElement(): BlockElement {
        return this.block;
    }

    /**
     * Get the start inline element
     * The start inline refers to inline before the selection start
     *  The reason why we choose the one before rather after is, when cursor is at the end of a paragragh,
     * the one after likely will point to inline in next paragragh which may be null if the cursor is at bottom of editor
     */
    public getStartInlineElement(): InlineElement {
        if (this.block) {
            switch (this.startFrom) {
                case ContentPosition.Begin:
                case ContentPosition.End:
                    return getInlineElementAtNode(
                        this.rootNode,
                        this.startFrom == ContentPosition.Begin
                            ? getFirstLeafNode(this.rootNode)
                            : getLastLeafNode(this.rootNode)
                    );
                case ContentPosition.SelectionStart:
                    // Get the inline before selection start position, and ensure it falls in the selection block
                    let startInline = getInlineElementBeforeAfter(
                        this.rootNode,
                        this.position,
                        true /*isAfter*/
                    );
                    return startInline && this.block.contains(startInline.getContainerNode())
                        ? startInline
                        : new EmptyInlineElement(this.position, this.block);
            }
        }

        return null;
    }

    /**
     * Check if the given block element is in current scope
     * @param blockElement The block element to check
     */
    public isBlockInScope(blockElement: BlockElement): boolean {
        return this.block && blockElement ? this.block.equals(blockElement) : false;
    }

    /**
     * Trim the incoming inline element, and return an inline element
     * This just tests and return the inline element if it is in block
     * This is a block scoper, which is not like selection scoper where it may cut an inline element in half
     * A block scoper does not cut an inline in half
     */
    public trimInlineElement(inlineElement: InlineElement): InlineElement {
        return this.block && inlineElement && this.block.contains(inlineElement.getContainerNode())
            ? inlineElement
            : null;
    }
}
