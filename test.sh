#!/bin/bash
# loop through json object per line file treating it as array, extract value from each object
# jq -s '.' ./yarn4-example.json | jq '.[0]' > ./yarn4-example-single.json

jq -s '.' ./yarn4-example.json | jq -c '.[]' | while read -r yarn4_cve; do
cve_name=$(echo "$yarn4_cve" | jq -r '.value')
cve_id=$(echo "$yarn4_cve" | jq -r '.children.ID')

# parse NPM Audit JSON with jq and find CVE entries that match by the name and also have the same ID in their "via" source field
npm_cve=$(jq --arg cve_name "$cve_name" --arg cve_id "$cve_id" '.vulnerabilities.[] | select((.name == $cve_name) and ((.via[].source | tostring) == $cve_id))' ./npm-example.json)
if [ -z "$npm_cve" ]; then
  npm_cve="{}"
fi

# extract CVSS Base Score and vectorString out of the CVSS object in the NPM audit report
base_score=$(echo "$npm_cve" | jq -r '(.via[]?.cvss?.score?) // empty')
vector_string=$(echo "$npm_cve" | jq -r '(.via[]?.cvss?.vectorString?) // null')
cvss=$(echo "$npm_cve" | jq -r '(.via[]?.cvss?) // null')

# if base score not ermpty add it to yarn 4
if [ -n "$base_score" ]; then
#   updated_yarn4_cve=$(echo "$yarn4_cve" | jq --arg base_score "$base_score" --arg vector_string "$vector_string" '.children + {cvss: {score: $base_score, vectorString: $vector_string}}')
  updated_yarn4_cve=$(echo "$yarn4_cve" | jq --argjson cvss "$cvss" '.children + {cvss: $cvss}')
fi

echo $updated_yarn4_cve

# append cvss to children object

# append base_score to yarn4_cve
# updated_yarn4_cve=$(echo "$yarn4_cve" | jq --arg base_score "$base_score" '. + {children: .children + {CVSS_Base_Score: $base_score}}')
done