import React from 'react';

import Loading from '@components/ui/loading';

export default class Layout extends React.Component {
    constructor(props) {
        super(props);
    };

    componentDidUpdate(prevProps) {
        if (this.props.location !== prevProps.location) {
            window.scrollTo(0, 0)
        }
    };

    render() {
        return (
            <div>
                roles
            </div>
        );
    };
};