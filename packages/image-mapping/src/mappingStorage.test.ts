import { ImageMappingStorage } from './mappingStorage';

describe('ImageMappingStorage', () => {
    let storage: ImageMappingStorage;

    beforeEach(() => {
        storage = new ImageMappingStorage();
    });

    test('should add basic image mappings without overriding existing ones', () => {
        storage.setBasicImgMapping({ 'key1.png': 'value1.png' });
        storage.setBasicImgMapping({ 'key2.png': 'value2.png' });

        expect(storage.basic).toEqual({
            'key1.png': 'value1.png',
            'key2.png': 'value2.png',
        });

        // Ensure existing mappings are not overridden
        storage.setBasicImgMapping({ 'key1.png': 'newValue1.png' });
        expect(storage.basic['key1.png']).toBe('value1.png');
    });

    test('should add custom image mappings and optimize them', () => {
        storage.addImgMapping({
            'key1.png': 'key2.png',
            'key2.png': 'key3.png',
            'key3.png': 'value.png',
        });

        expect(storage.custom).toEqual({
            'key1.png': 'value.png',
            'key2.png': 'value.png',
            'key3.png': 'value.png',
        });
    });

    test('should detect and handle circular dependencies', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        storage.addImgMapping({
            'key1.png': 'key2.png',
            'key2.png': 'key3.png',
            'key3.png': 'key1.png', // Circular dependency
        });

        // Ensure circular dependency is detected and skipped
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Circular dependency detected during optimization: key1.png'
        );
        expect(storage.custom).toEqual({}); // No valid mappings should be added

        consoleWarnSpy.mockRestore();
    });

    test('should map image sources correctly', () => {
        storage.setBasicImgMapping({ 'basic1.png': 'basicValue1.png' });
        storage.addImgMapping({
            'custom1.png': 'basic1.png',
            'custom2.png': 'custom1.png',
        });

        expect(storage.mapImgSrc('custom2.png')).toBe('basicValue1.png');
        expect(storage.mapImgSrc('basic1.png')).toBe('basicValue1.png');
        expect(storage.mapImgSrc('nonexistent.png')).toBe('nonexistent.png');
    });

    test('should handle data URLs and external URLs without mapping', () => {
        const dataUrl = 'data:image/png;base64,...';
        const externalUrl = 'http://example.com/image.png';

        expect(storage.mapImgSrc(dataUrl)).toBe(dataUrl);
        expect(storage.mapImgSrc(externalUrl)).toBe(externalUrl);
    });

    test('should call accept function when mapping occurs', () => {
        const acceptMock = jest.fn();

        storage.setBasicImgMapping({ 'basic1.png': 'basicValue1.png' });
        storage.addImgMapping({ 'custom1.png': 'basic1.png' });

        storage.mapImg('custom1.png', acceptMock);

        expect(acceptMock).toHaveBeenCalledWith('basicValue1.png');
    });

    test('should not call accept function when no mapping occurs', () => {
        const acceptMock = jest.fn();

        storage.mapImg('nonexistent.png', acceptMock);

        expect(acceptMock).not.toHaveBeenCalled();
    });

    test('should @nomap images without mapping', () => {
        storage.addImgMapping({
            'custom1.png': 'basic1.png',
            '@nomap/custom1.png': 'basic1.png', // This should not be mapped
        });
        
        const nomapImage = '@nomap/custom1.png';
        expect(storage.mapImgSrc(nomapImage)).toBe('custom1.png'); // Should strip @nomap/ prefix
    });
});