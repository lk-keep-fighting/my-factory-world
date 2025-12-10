// Simple test to ensure the module can be loaded
describe('Editor module', () => {
  it('should have valid exports', () => {
    const editorModule = require('./index');
    expect(editorModule).toBeDefined();
    expect(typeof editorModule.PropertiesPanel).toBe('function');
    expect(typeof editorModule.useEditorStore).toBe('function');
  });
});
