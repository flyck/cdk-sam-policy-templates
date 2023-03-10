import policies from "./policy_templates.json"
import * as fs from 'fs';
import path from "path";


function main() {
  let code = `import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import { Stack } from "aws-cdk-lib";
import path from "path";\n`
  let counter = 0
  for (const [key, value] of Object.entries(policies.Templates)) {
    const parameters = {
      ...value.Parameters,
      RoleName: {
        Description: "Name of the Target Role Function"
      }
    }
    let templateString = fs.readFileSync(path.join(__dirname, './template.json')).toString()
    templateString = templateString.replace('PolicyNamePlaceholder', key)
      .replace('PolicyLogicalIdPlaceholder', key)
      .replace('DescriptionPlaceholder', value.Description)
      .replace('"ParametersPlaceholder"', JSON.stringify(parameters, null, 4))
      .replace('"PolicyDocumentPlaceholder"', JSON.stringify(value.Definition, null, 4))

    fs.writeFileSync(`src/generated/${key}.json`, templateString)

    code += `
/** ${value.Description} */
import ${key}Json from "./${key}.json"
function ${key}(stack: Stack, parameters: {${concatenator(Object.keys(parameters))}}) {
  return new CfnInclude(stack, "Sam${key}", {
    templateFile: path.join(__dirname, './${key}.json'),
    parameters
  })
}
`
  }

  code += `export {${Object.keys(policies.Templates).join(",")}}`

  fs.writeFileSync("src/generated/main.ts", code)
}

function concatenator(parameterss: string[]) {
  let parameterType = ""
  parameterss.forEach(key => {
    parameterType += `${key}: string, `
  })
  return parameterType
}


export default main