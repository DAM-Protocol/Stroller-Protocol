import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const config = {
	initialColorMode: 'dark',
};

const colors = {
	brand: {
		darkBg: {
			100: '#1a3f6e',
			600: '#152e4d',
			700: '#12263f',
			900: '#0c192a',
		},
	},
};
const styles = {
	global: (props) => ({
		body: {
			background: mode(
				"url('/bg-tile-light.png')",
				"url('/bg-tile-dark.png')"
			)(props),
			backgroundAttachment: 'fixed',
		},
	}),
};

const theme = extendTheme({
	config,
	colors,
	styles,
});

export default theme;
