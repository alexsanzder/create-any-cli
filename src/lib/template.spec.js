// @flow

jest.mock('./file.js');

const inquirer = require('inquirer');
const file: any = require('./file.js');
const template = require('./template.js');

describe('template.createDecoratedTemplateArgs()', () => {
  it('should be a function', () => {
    expect(typeof template.createDecoratedTemplateArgs).toBe('function');
  });

  it('should decorate the given argsByKey with lodashs string manipulation methods and return a newly shaped object with the same keys.', () => {
    const args = template.createDecoratedTemplateArgs({
      foo: 'Foo example',
      bar: 'bar example',
      baz: 'baz-example'
    });

    expect(args).toMatchSnapshot();
  });
});

describe('template.processTemplateAndCreate()', () => {
  beforeEach(() => {
    file.readdirAsync.mockReturnValue([]);
    file.globAsync.mockReturnValueOnce([
      '/usr/foo/package.json',
      '/usr/foo/{{=it.name}}/foo.txt'
    ]);
    file.readFileAsync
      .mockReturnValueOnce('{"name": "{{=it.name}}"}')
      .mockReturnValueOnce(
        'The application name is: {{=it.name.toUpperCase()}}'
      );
  });

  afterEach(() => {
    // $FlowFixMe: Ignore errors since the jest type-def is out of date.
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof template.processTemplateAndCreate).toBe('function');
  });

  it('should iterate over all filePatterns of the given directory. process the contents with the given arguments and write the filePatterns to the "distDir" location.', async () => {
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      }
    });

    expect(file.globAsync).toHaveBeenCalledTimes(1);
    expect(file.globAsync).toHaveBeenCalledWith(['/usr/foo/src/*'], {
      ignore: [],
      nodir: true,
      symlinks: false
    });

    expect(file.ensureDir).toHaveBeenCalledTimes(1);
    expect(file.ensureDir).toHaveBeenCalledWith('/usr/bar');

    expect(file.readFileAsync).toHaveBeenCalledTimes(2);
    expect(file.readFileAsync).toHaveBeenCalledWith(
      '/usr/foo/package.json',
      'utf8'
    );
    expect(file.readFileAsync).toHaveBeenCalledWith(
      '/usr/foo/{{=it.name}}/foo.txt',
      'utf8'
    );

    expect(file.writeFileAsync).toHaveBeenCalledTimes(2);
    expect(file.writeFileAsync).toHaveBeenCalledWith(
      '/usr/bar/package.json',
      '{"name": "My App"}'
    );
    expect(file.writeFileAsync).toHaveBeenCalledWith(
      '/usr/bar/My App/foo.txt',
      'The application name is: MY APP'
    );
  });

  it('should not read or write any files if the directory is not empty but execute the "onInvalidDistDir" hook.', async () => {
    file.readdirAsync.mockReturnValue(['foo']);

    const onInvalidDistDir = jest.fn();
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks: {
        onInvalidDistDir
      }
    });

    expect(onInvalidDistDir).toHaveBeenCalledTimes(1);
    expect(onInvalidDistDir).toHaveBeenCalledWith('/usr/bar');
    expect(file.readFileAsync).toHaveBeenCalledTimes(0);
    expect(file.writeFileAsync).toHaveBeenCalledTimes(0);
  });

  it('should support overriding the template engine with the "onTemplate" hook.', async () => {
    const hooks = {
      onTemplate: jest.fn(str => str + 'foo')
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onTemplate).toHaveBeenCalledTimes(4);
    expect(hooks.onTemplate.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onTemplate.mock.calls[1]).toMatchSnapshot();
    expect(hooks.onTemplate.mock.calls[2]).toMatchSnapshot();
    expect(hooks.onTemplate.mock.calls[3]).toMatchSnapshot();
  });

  it('should execute the hook "onBeforeReadFile" function.', async () => {
    const hooks = {
      onFile: jest.fn(() => ({someMockContext: true})),
      onBeforeReadFile: jest.fn()
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onBeforeReadFile).toHaveBeenCalledTimes(2);
    expect(hooks.onBeforeReadFile.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onBeforeReadFile.mock.calls[1]).toMatchSnapshot();
  });

  it('should execute the hook "onAfterReadFile" function.', async () => {
    const hooks = {
      onFile: jest.fn(() => ({someMockContext: true})),
      onAfterReadFile: jest.fn()
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onAfterReadFile).toHaveBeenCalledTimes(2);
    expect(hooks.onAfterReadFile.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onAfterReadFile.mock.calls[1]).toMatchSnapshot();
  });

  it('should execute the hook "onBeforeProcessFile" function.', async () => {
    const hooks = {
      onFile: jest.fn(() => ({someMockContext: true})),
      onBeforeProcessFile: jest.fn()
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onBeforeProcessFile).toHaveBeenCalledTimes(2);
    expect(hooks.onBeforeProcessFile.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onBeforeProcessFile.mock.calls[1]).toMatchSnapshot();
  });

  it('should execute the hook "onAfterProcessFile" function.', async () => {
    const hooks = {
      onFile: jest.fn(() => ({someMockContext: true})),
      onAfterProcessFile: jest.fn()
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onAfterProcessFile).toHaveBeenCalledTimes(2);
    expect(hooks.onAfterProcessFile.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onAfterProcessFile.mock.calls[1]).toMatchSnapshot();
  });

  it('should execute the hook "onBeforeWriteFile" function.', async () => {
    const hooks = {
      onFile: jest.fn(() => ({someMockContext: true})),
      onBeforeWriteFile: jest.fn()
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onBeforeWriteFile).toHaveBeenCalledTimes(2);
    expect(hooks.onBeforeWriteFile.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onBeforeWriteFile.mock.calls[1]).toMatchSnapshot();
  });

  it('should execute the hook "onAfterWriteFile" function.', async () => {
    const hooks = {
      onFile: jest.fn(() => ({someMockContext: true})),
      onAfterWriteFile: jest.fn()
    };
    await template.processTemplateAndCreate({
      dist: '/usr/bar',
      template: {
        src: '/usr/foo',
        args: {
          name: 'My App'
        },
        filePatterns: ['src/*']
      },
      hooks
    });

    expect(hooks.onAfterWriteFile).toHaveBeenCalledTimes(2);
    expect(hooks.onAfterWriteFile.mock.calls[0]).toMatchSnapshot();
    expect(hooks.onAfterWriteFile.mock.calls[1]).toMatchSnapshot();
  });
});

describe('template.resolveAndPromptOptions()', () => {
  let prompt;

  beforeEach(() => {
    prompt = jest.spyOn(inquirer, 'prompt').mockImplementation(jest.fn());
  });

  afterEach(() => {
    // $FlowFixMe: Ignore errors since the jest type-def is out of date.
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof template.resolveAndPromptOptions).toBe('function');
  });

  it('should return an empty object if no arguments where provided', async () => {
    const answers = await template.resolveAndPromptOptions();

    expect(answers).toEqual({});
  });

  it('should execute inquirers "prompt" method with the the questions whose answers where not provided within the flags object', async () => {
    prompt.mockReturnValueOnce({
      'ask-something': 'much interactiveness'
    });
    const interactiveQuestions = [
      {
        type: 'input',
        name: 'ask-something',
        message: 'Yo waddup'
      }
    ];
    const questions = [
      {
        type: 'input',
        name: 'provided-via-cli-flag',
        message: 'Nice'
      },
      ...interactiveQuestions
    ];
    const flags = {
      'provided-via-cli-flag': 'bar'
    };
    const answers = await template.resolveAndPromptOptions(questions, flags);

    expect(answers).toMatchSnapshot();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(prompt).toHaveBeenCalledWith(interactiveQuestions);
  });

  it('should support the "onImplicitQuestion" and "onInteractiveQuestion" hooks', async () => {
    const onImplicitQuestion = jest.fn((q, val) => q);
    const onInteractiveQuestion = jest.fn(q => q);
    const questions = [
      {
        type: 'input',
        name: 'provided-via-cli-flag',
        message: 'Nice'
      },
      {
        type: 'input',
        name: 'ask-something',
        message: 'Yo waddup'
      }
    ];
    const flags = {
      'provided-via-cli-flag': 'bar'
    };
    // $FlowFixMe: Ignore errors since the jest.fn is of a different type and that is totally fine for this test case.
    await template.resolveAndPromptOptions(questions, flags, {
      onImplicitQuestion,
      onInteractiveQuestion
    });

    expect(onImplicitQuestion).toHaveBeenCalledTimes(1);
    expect(onImplicitQuestion).toHaveBeenCalledWith(questions[0], 'bar');
    expect(onInteractiveQuestion).toHaveBeenCalledTimes(1);
    expect(onInteractiveQuestion).toHaveBeenCalledWith(questions[1]);
  });
});
