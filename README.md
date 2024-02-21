# GitHub Action: Pull Request Metadata Extractor

This GitHub Action allows you to extract data from a pull request's description. This can then be used to automate workflows based on the content of the pull request.

## Usage

To use this action, you need to add it to your workflow file. Here's an example of how to do this:

```yaml
name: Extract PR Description

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Extract PR Description
      id: extract_pr
      uses: tomfreeman/markdown-data@v1

    - name: Use extracted data
      run: echo "PR Description: ${{ steps.extract_pr.outputs.data }}"
```

In this example, the `Extract PR Description` step uses the `markdown-data` action.

The output of the action is available in the `steps.extract_pr.outputs.data` variable, which can be used in subsequent steps in your workflow.

## Outputs

- `data`: An object representing the data embedded in the description.

## Contributing

Contributions to this GitHub Action are welcome! Please submit a pull request or create an issue if you have any improvements or suggestions.

## License

This GitHub Action is released under the MIT License. See the `LICENSE` file for more details.