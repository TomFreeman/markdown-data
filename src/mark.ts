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
        }
        next = walker.next();
    } while (next !== null)
    return elements;
}
