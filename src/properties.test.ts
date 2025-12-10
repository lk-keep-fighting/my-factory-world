// Properties module tests
describe('Properties module', () => {
  it('should be able to load the properties module', () => {
    const propertiesModule = require('./simulation/types');
    expect(propertiesModule).toBeDefined();
    expect(propertiesModule.Position).toBeDefined();
  });
});
