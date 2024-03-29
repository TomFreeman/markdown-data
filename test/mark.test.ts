import { readFileSync } from 'node:fs';
import { readAllElements } from '../src/mark';
import { expect } from 'earl'
import { describe, it } from 'mocha'

describe('Read example.md', () => {
    it('should read the text in example.md', () => {

        const filePath = `${__dirname}/data/example.md`;
        const text = readFileSync(filePath, 'utf-8');
        const elements = readAllElements(text);

        expect(text.length).toBeGreaterThan(0);
        expect(elements).toEqual({
            data1: "foo1",
            issue: "XX",
            data2: "value2",
            quote: "this is a quote",
            quote2: "this is another quote",
            quote3: "this is a monospace quote",
        })
    });

    it('should read the text in codeBlockExample.md', () => {

        const filePath = `${__dirname}/data/codeBlockExample.md`;
        const text = readFileSync(filePath, 'utf-8');
        const elements = readAllElements(text);

        expect(text.length).toBeGreaterThan(0);
        expect(elements).toEqual({
            human: {
                name: "John Doe",
                age: 30,
                cars: {
                    car1: "Ford",
                    car2: "BMW",
                    car3: "Fiat"
                }
            },
            human2: {
                name: "John Two",
                age: 32,
                cars: {
                    car1: "Ford"
                }
            }
        })
    });

    it('checkboxes are parsed as booleans', () => {
        const filePath = `${__dirname}/data/checkBoxes.md`;
        const text = readFileSync(filePath, 'utf-8');

        const elements = readAllElements(text);

        expect(elements).toHaveSubset({
            task1: false,
        });
    });

    it('lists are parsed as arrays', () => {
        const filePath = `${__dirname}/data/checkBoxes.md`;
        const text = readFileSync(filePath, 'utf-8');

        const elements = readAllElements(text);

        expect(elements).toHaveSubset({
            array: ["One", "Two", "Three"],
        });
    });
});
