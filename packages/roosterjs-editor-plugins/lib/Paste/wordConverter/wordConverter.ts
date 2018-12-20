import CustomData, { createCustomData } from './CustomData';
import WordConverterArguments from './WordConverterArguments';

/** Processes HTML generated by Word, converting Word Lists into standard HTML UL and OL tags */
export default interface WordConverter {
    /** Next unique id to be assigned to a list */
    nextUniqueId: number;

    /** Number of bullets converted */
    numBulletsConverted: number;

    /** Number of numbering converted */
    numNumberedConverted: number;

    /** The structure that records the status of the conversion */
    wordConverterArgs: WordConverterArguments;

    /** Custom data storage for list items */
    customData: CustomData;
}

/** create an empty WordConverter */
export function createWordConverter(): WordConverter {
    return {
        nextUniqueId: 1,
        numBulletsConverted: 0,
        numNumberedConverted: 0,
        wordConverterArgs: null,
        customData: createCustomData(),
    };
}
