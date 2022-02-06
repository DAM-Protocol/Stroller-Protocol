import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const config = {
	initialColorMode: 'dark',
};

const colors = {
	brand: {
		darkBg: {
			100: '#1a7032',
			600: '#154c24',
			700: '#12401f',
			900: '#0c2c15',
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
