

function* recurse(input, preOrderKeys) {
  let list = Object.keys(input);

  if(preOrderKeys) {
    list = preOrderKeys(list)
  }

  yield { opening: true }

  while (list.length){
    let key = list.shift();
    if (Array.isArray(input[key]) && input[key].length) {
      for (let child of input[key]){
        yield { forwarding: true }
        yield* recurse(child, preOrderKeys)
      }
    } else {
      let output = {};
      output[key] = input[key];
      yield output;
    }
  }
  yield { closing: true }
  return true;
}


function* token_json(input_json, preOrderKeys){
  let input = JSON.parse(input_json);

  yield* recurse(input, preOrderKeys)

  return true
}

module.exports = token_json
