import * as github from '@actions/github';
import * as core from '@actions/core';
import { readAllElements } from './mark';

function unfoldOutput(prefix: string, elements: any) {
    if (prefix !== "") {
        prefix = prefix + ".";
    }

    for (const key in elements) {
        const value = elements[key];
        if (typeof value === 'object') {
            unfoldOutput(`${prefix}${key}_`, value);
        } else {
            core.setOutput(`${prefix}${key}`, value);
        }
    }
}

async function run() {
    // Runs on issues or PRs
    // Get the text of the issue or PR body
    const body = github.context.payload.issue?.body || github.context.payload.pull_request?.body;

    core.debug(`Body:\n ${body}`);

    if (body != undefined) {
        core.info('Parsing markdown')
        // Parse the markdown for reference links as a first attempt at a syntax
        const elements = readAllElements(body)

        core.debug(`Elements:\n ${JSON.stringify(elements)}`);

        if (Object.keys(elements).length === 0) {
            core.info('No data found');
        }

        // Store the elements as outputs
        unfoldOutput("", elements);
    } else {
        core.warning('No issue or PR body found');
    }
}

run();
