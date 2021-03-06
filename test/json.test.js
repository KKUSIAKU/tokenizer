const { expect } = require("chai")
const { json_tokenizer } = require('../index');
const token_json = require("../src/json");


describe('Tokenizer: json', () => {
  it('Should return generator', (done) => {
    const tokengen = json_tokenizer(JSON.stringify({ type: 'Page' }))
    expect(tokengen.next).to.exist;
    expect(tokengen.next().done).equal(false)
    done()
  })

  it('should indicate opening before start messaging content', (done) => {
    const tokengen = json_tokenizer(JSON.stringify({}))
    expect(tokengen.next).to.exist;
    expect(tokengen.next().value).to.deep.equal({ opening: true })
    done()
  })

  it('should indicate close before resolving generator', (done) => {
    const tokengen = json_tokenizer(JSON.stringify({}))
    tokengen.next();
    expect(tokengen.next().value).to.deep.equal({ closing: true })
    done()
  })

  it('should yield value in preOrderKeys argumnet', (done) => {
    const payload = { key1: 'key1', key2: 'key2', key3: 'key3' }
    const preOrder = () => ['key1', 'key3', 'key2'];
    const tokengen = json_tokenizer(JSON.stringify(payload), preOrder);
    tokengen.next()
    const keys = preOrder();
    keys.map((key) => {
      let genVal = tokengen.next();
      let expected = {};
      expected[key] = payload[key];
      expect(genVal.value).to.exist;
      expect(genVal.value).to.deep.equal(expected)
      expect(genVal.done).equal(false)
    })
    tokengen.next()
    expect(tokengen.next().done).equal(true)
    done()
  })

  it('should yield forward when encounter array field property', (done) => {
    const payload = { children: [{}] }
    const preOrder = () => ['children'];
    const tokengen = json_tokenizer(JSON.stringify(payload), preOrder);
    tokengen.next()
    expect(tokengen.next().value).to.deep.equal({ forwarding: true })
    done()
  })

  it('should yield opeining and clossing on every child nodes process', (done) => {
    const payload = { children: [{ one: 'one' }, { two: 'two' }, { three: 'three' }] }
    // this preOrder could be flexibility issue: however allow progress on dev for now
    const preOrder = (keys) => keys;
    const tokengen = json_tokenizer(JSON.stringify(payload), preOrder);
    tokengen.next()

    payload.children.map((child) => {
      expect(tokengen.next().value).to.deep.equal({ forwarding: true })
      expect(tokengen.next().value).to.deep.equal({ opening: true })
      expect(tokengen.next().value).to.deep.equal(child)
      expect(tokengen.next().value).to.deep.equal({ closing: true })
    })
    expect(tokengen.next().value).to.deep.equal({ closing: true })
    done()
  })
  
  it('should walk correctly through deep nested object ', () => {
    const payload = {
      root: 'root',
      children: [
        { level11: 'level11', children: [{ level111: 'level111' }, { level112: 'level112', children: [{ leaf0: 'leaf0' }, { leaf1: 'leaf1' }] }] }
      ]
    };
   let results = [];
    const gen = token_json(JSON.stringify(payload))
    let current = gen.next();
    while (!current.done) {
   
      results.push(current.value)
      current = gen.next();
    }
    results = results.filter((obj) => (!obj.opening && !obj.forwarding && !obj.closing))
    expect(results).to.deep.equal([
      { root: 'root' },
      { level11: 'level11' },
      { level111: 'level111' },
      { level112: 'level112' },
      { leaf0: 'leaf0' },
      { leaf1: 'leaf1' }
    ])
  })


})