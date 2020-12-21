import PropTypes from 'prop-types'

const ContextTypes = {
  tree: PropTypes.shape({
    onNodeClick: PropTypes.func,
    onNodeExpand: PropTypes.func,
    onNodeSelect: PropTypes.func,
  }),
}

export default ContextTypes
