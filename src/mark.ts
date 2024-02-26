import * as commonmark from "commonmark";
import { load } from 'js-yaml';

type elementCollection = { [key: string]: any | elementCollection };
type parsers = { [key: string]: (text: string) => any };

const parse_strategy: parsers = {
    "json": (text: string) => JSON.parse(text),
    "yaml": (text: string) => load(text)
}

function readWordOrQuote(walker: commonmark.NodeWalker): string {
    var next = walker.next();

    // Consume all the leading spaces.
    if (next?.node.literal === " ") {
        next = walker.next();
        return readWordOrQuote(walker);
    }

    // If the next node is a quote, read the quoted thing
    if (next?.node.literal === "\"" || next?.node.literal === "'") {
        next = walker.next();
        return next?.node.literal || "";
    } else if (next?.node.type === "code") {
        // If the next node is a code block, read the whole code block
        return next?.node.literal || "";
    }else {
        // Read until the first space
        return next?.node.literal?.split(" ")[0] || "";
    }
}

function readTextUntil(next: commonmark.NodeWalkingStep | null,walker: commonmark.NodeWalker, end: string, limit: number): string {
    let text = next?.node.literal || "";
    var count = 0;

    while (next !== null && next.node.type === "text" && count++ < limit) {
        next = walker.next();
        if (next === null) {
            break;
        }
        text += next.node.literal;

        if (text.endsWith(end)) {
            break;
        }
    }
    return text;
}

function readParagraph(walker: commonmark.NodeWalker): string {
    let next = walker.next();
    let text = "";
    while (next !== null && next.node.type !== "paragraph") {
        text += next.node.literal;
        next = walker.next();
    }
    return text;
}

function readList(walker: commonmark.NodeWalker): Array<string> {
    // Read all the items as array elements
    const items: Array<string> = [];
    let next = walker.next();
    while (next !== null && next.node.type === "item") {
        next = walker.next();
        items.push(readParagraph(walker));

        // Now read to the end of the item
        while (next !== null && next.node.type !== "item") {
            next = walker.next();
        }
        next = walker.next();
    }

    return items
}



export function readAllElements(body: string): elementCollection {
    const reader = new commonmark.Parser();
    const parsed = reader.parse(body);
    const walker = parsed.walker();
    const elements: elementCollection = {};
    const html_block_regex = /<\? _data_:(\w+) \?>(\w+)/
    const html_inline_regex = /<\? _data_:(\w+) \?>/
    const code_block_regex = /_data_:(\w+)/
    let next = walker.next();
    if (next === null) {
        return elements;
    }

    do {
        if (next?.node.type === "html_block") {
            // Check if matches the custom pattern <? _data_:data1 ?>foo1
            if (html_block_regex.test(next?.node.literal || "")) {
                const matches = html_block_regex.exec(next?.node.literal || "");
                if (matches !== null) {
                    const key = matches[1];
                    const value = matches[2];
                    elements[key] = value;
                }
            } else if (html_inline_regex.test(next?.node.literal || "")) {
                // Possibly the start of a list
                const matches = html_inline_regex.exec(next?.node.literal || "");
                if (matches !== null) {
                    const key = matches[1];
                    next = walker.next();
                    if (next?.node.type === "list") {
                        elements[key] = readList(walker);
                    }
                }
            }
        } else if (next?.node.type === "html_inline") {
            // If current node matches the pattern <? _data_:data1 ?>
            // then extract the value from the next node along
            if (html_inline_regex.test(next?.node.literal || "")) {
                const matches = html_inline_regex.exec(next?.node.literal || "");
                if (matches !== null) {
                    const key = matches[1];
                    elements[key] = readWordOrQuote(walker);
                }
            }
        } else if (next?.node.type === "code_block") {
            // Check if the info string contains _data_:(\w+)
            const info = next?.node.info;
            if (info !== null) {
                const matches = code_block_regex.exec(info);
                if (matches !== null) {
                    const key = matches[1];
                    const value = next?.node.literal || "";
                    // pick the right parsing strategy from the first line of the info string
                    const language = info.split(" ")[0];

                    const parser = parse_strategy[language];
                    if (parser !== undefined) {
                        elements[key] = parser(value);
                    }
                    else {
                        elements[key] = value;
                    }
                }
            }
        } else if (next?.node.type === "item") {
            // Read on until we get some text
            while (next != null && next?.node.type !== "text") {
                next = walker.next();
            }

            var value = false;

            // If the item starts with a square bracket, read until a space
            if (next?.node.literal?.startsWith("[") === true) {
                const text = readTextUntil(next, walker, "]", 7);

                value = text.toLowerCase() == "[x]";
            }

            // Skip all the spaces
            do {
                next = walker.next();
            } while (next?.node.type === "text" && next?.node.literal === " ");

            // If the next node is inline html, we should extract the key from it
            if (next?.node.type === "html_inline") {
                const matches = html_inline_regex.exec(next?.node.literal || "");
                if (matches !== null) {
                    const key = matches[1];
                    elements[key] = value;
                }
            }
        }
        next = walker.next();
    } while (next !== null)
    return elements;
}
