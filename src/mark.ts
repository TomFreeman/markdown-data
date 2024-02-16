import * as commonmark from "commonmark";
import { load } from 'js-yaml';

type elementCollection = { [key: string]: any | elementCollection };
type parsers = { [key: string]: (text: string) => any };

const parse_strategy: parsers = {
    "json": (text: string) => JSON.parse(text),
    "yaml": (text: string) => load(text)
}

export function readAllElements(body: string): elementCollection {
    const reader = new commonmark.Parser();
    const parsed = reader.parse(body);
    const walker = parsed.walker();
    const elements: elementCollection = {};
    const match_inline = /<\? _data_:(\w+) \?>(\w+)/
    const match_block = /_data_:(\w+)/
    let next = walker.next();
    if (next === null) {
        return elements;
    }

    do {
        if (next?.node.type === "html_block") {
            // Check if matches the custom pattern <? _data_:data1 ?>foo1
            if (match_inline.test(next?.node.literal || "")) {
                const matches = match_inline.exec(next?.node.literal || "");
                if (matches !== null) {
                    const key = matches[1];
                    const value = matches[2];
                    elements[key] = value;
                }
            }
        } else if (next?.node.type === "code_block") {
            // Check if the info string contains _data_:(\w+)
            const info = next?.node.info;
            if (info !== null) {
                const matches = match_block.exec(info);
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
