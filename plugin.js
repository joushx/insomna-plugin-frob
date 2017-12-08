var md5 = require('js-md5');

module.exports.templateTags = [
  {
    name: 'frob_signature',
    displayName: 'Frob auth signature',
    description: 'Gives the api_sig value for this request used in frob based authentication',
    args: [
      {
        type: 'string',
        displayName: 'Shared Secret'
      }
    ],
    async run (context, shared_secret) {
      const {meta} = context;
      if (!meta.requestId || !meta.workspaceId) {
        return null;
      }

      // get current request
      const request = await context.util.models.request.getById(meta.requestId);
      if (!request) {
        throw new Error(`Request not found for ${meta.requestId}`);
      }

      return createSignature(context, request, shared_secret);
    }
  }
];

async function getParameters(context, request){
  const parameters = [];
  for(var i = 0; i < request.parameters.length; i++){

    // do nothing for itself
    if (request.parameters[i].value.indexOf("frob_signature") > -1){
      continue;
    }

    // resolve parameter values and add to list
    parameters.push({
      name: await context.util.render(request.parameters[i].name),
      value: await context.util.render(request.parameters[i].value)
    });
  }

  return parameters;
}

async function createSignature(context, request, shared_secret){
  const parameters = await getParameters(context, request);

  // sort parameters by name
  var sorted = parameters.sort(function(a,b){
    return a.name > b.name;
  });

  // create signature string
  var str = shared_secret;
  sorted.forEach(function(item, index){
    str += item.name + item.value;
  });

  return md5(str);
}
