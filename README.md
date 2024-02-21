# GitHub Action: Pull Request Metadata Extractor

This GitHub Action allows you to extract data from a pull request's description. This can then be used to automate workflows based on the content of the pull request.

## Usage

To use this action, you need to add it to your workflow. The output of the action is available in `steps.extract_pr.outputs`, which can be used in subsequent steps in your workflow. Here's an example of how to do this:

Given a description containing the following:

```markdown
...

Fixes <? _data_:fixes ?>bug1 .

...
```

And a template for a workflow:

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
      run: echo "Fixed bugs: ${{ steps.extract_pr.outputs.fixes }}"
```

We should get the output of fixes to be `bug1`.

If your output is a json object, you can use `fromJSON` to parse it, or the elements
will be available, using `_` as a separator.

e.g. if the output is:

```json
{
  "data": {
    "fixes": "bug1",
    "issue": "XX"
  }
}
```

If will be available as `steps.extract_pr.outputs.data_fixes` and `steps.extract_pr.outputs.data_issue`.

## Contributing

Contributions to this GitHub Action are welcome! Please submit a pull request or create an issue if you have any improvements or suggestions.

## License

This GitHub Action is released under the MIT License. See the `LICENSE` file for more details.
