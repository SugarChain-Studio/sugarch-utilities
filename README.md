# BC Mod Utilities

A collection of utilities and tools for developing mods for BC. This project is organized as a monorepo using pnpm to manage multiple packages.

## About

This monorepo contains various packages designed to streamline the development of BC mods. Each package focuses on a specific aspect of mod development, providing reusable components and utilities to make the modding process easier and more efficient.

## Components

### [@sugarch/bc-mod-hook-manager](packages/bc-mod-hook-manager)
A package that wraps the bcModSdk to provide a more flexible hook mechanism. It simplifies the creation and management of mods by offering a loose coupling of hooks and utilities.

### [@sugarch/bc-asset-manager](packages/bc-asset-manager)
A package for managing assets in BC. It includes functions for loading, modifying, and validating assets, as well as handling custom dialogs and image mappings.

### [@sugarch/bc-event-handler](packages/bc-event-handler)
A package for handling BC chat events using the EventEmitter interface. It provides a robust event system to manage custom events, making it easier to create responsive and interactive mods.

## Contributing
We welcome contributions! If you have any issues or suggestions, please feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.