import { gql } from '@apollo/client';

const GET_SUPER_TOKENS = gql`
	query Tokens($where: Token_filter) {
		tokens(where: $where) {
			name
			id
			symbol
			decimals
			underlyingAddress
			underlyingToken {
				name
				symbol
			}
		}
	}
`;
export default GET_SUPER_TOKENS;
