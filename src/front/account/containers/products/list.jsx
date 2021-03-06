import React from 'react';

import API from '@common/core/api';
import Loading from '@components/ui/loading';
import Modal from '@components/ui/modal';
import Message from '@components/ui/message';
import Input from '@components/ui/input';

export default class List extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            productsList: undefined,
            currentProduct: undefined,
            changes: undefined,
            show: undefined
        };
        this.show = (page, currentProduct = {}) => this.setState({show: page, currentProduct});
        this.close = () => this.setState({show: undefined, currentProduct: undefined, changes: undefined});
        this.updateProductsList = async () => {
            this.setState({loading: true});
            const {error, data: productsList} = await API.request('products', 'list');
            if (!error)
                this.setState({loading: false, productsList});
            else
                Message.send('ошибка при обновлении списка продуктов, повторите попытку позже');
        };
        this.saveChanges = async () => {
            const {currentProduct, changes = {}, show} = this.state;

            let data;
            if (show === 'editPage')
                data = {_id: currentProduct._id, changes};
            else if (show === 'createPage')
                data = currentProduct;

            const {error} = await API.request('products', 'update', data);

            if (error) {
                Message.send(`ошибка при ${((show === 'editPage') && 'редактировании') || ((show === 'createPage') && 'создании')} продукта, повторите попытку позже`, Message.type.danger);
                this.close();
            } else {
                Message.send(`продукт успешно ${((show === 'editPage') && 'изменен') || ((show === 'createPage') && 'создан')}`, Message.type.success);
                this.close();
                this.updateProductsList();
            }
        };
        this.deleteProduct = async productID => {
            const {currentProduct, show} = this.state;
            const {error} = await API.request('products', 'update', {_id: (productID || currentProduct._id)});
            if (!error) {
                if (show === 'editPage')
                    this.setState({show: undefined});
                this.updateProductsList();
                Message.send('продукт успешно удален', Message.type.success);
            } else
                Message.send('ошибка при удалении продукта, повторите попытку позже', Message.type.danger);
        };
        this.handleUpload = async e => {
            const selectedFile = e.target.files[0];

            const reader = new FileReader();
            reader.onload = (file => async () => {
                const content = file.result;
                const {error, data: errorRows} = await API.request('products', 'upload-data', {type: 'csv', content});
                // errorRows - массив номеров строк файла, в которых произошла ошибка.
                if (error)
                    Message.send('ошибка при добавлении продуктов, повторите попытку позже', Message.type.danger);
                else if (!error && errorRows.length > 0) {
                    Message.send(`продукты успешно добавлены, но допущены ошибки в строках: ${errorRows.toString()}`, Message.type.info);
                    this.updateProductsList();
                } else {
                    Message.send('продукты успешно добавлены', Message.type.success);
                    this.updateProductsList();
                }
            })(reader);
            reader.readAsText(selectedFile);
        };
        this.handleExport = async () => {
            const {error} = await API.request('products', 'get-data', {type: 'csv'});
        };
        this.buttons = [
            {
                name: 'сохранить',
                types: 'primary',
                handler: this.saveChanges
            },
            {
                name: 'закрыть',
                types: 'secondary',
                handler: this.close
            }
        ];
    };

    componentWillMount() {
        this.getInitialDataFromSrv();
    };

    async getInitialDataFromSrv() {
        const {error, data: productsList} = await API.request('products', 'list');
        if (!error)
            this.setState({loading: false, productsList});
        else
            Message.send('ошибка при получении списка продуктов, повторите попытку позже', Message.type.danger);
    };

    renderPropMedia(prop) {
        let {currentProduct, changes} = this.state;
        return ((changes && changes[prop]) || currentProduct[prop]).map((image, key) => (
            <div key={key}>
                <img src={image}/>
                <div className="icon remove-button" onClick={() => {
                    changes = changes || {};
                    changes[prop] = [...currentProduct.media];
                    changes[prop].splice(key, 1);
                    this.setState({changes})
                }}/>
            </div>
        ));
    };

    renderPropList(prop) {
        let {currentProduct, changes} = this.state;
        return ((changes && changes[prop]) || currentProduct[prop]).map((field, key) => (
            <div key={key}>
                <span>{field.name}</span>
                <Input value={field.value} onChange={value => {
                    changes = changes || {};
                    changes[prop] = [...currentProduct[prop]];
                    changes[prop][key] = value;
                    this.setState({changes});
                }}/>
            </div>
        ));
    };

    renderProp(prop, key) {
        let {currentProduct, changes, show} = this.state;
        return (
            <div key={key}>
                <span>{prop}</span>
                <Input value={(show === 'editPage') ? ((changes && changes[prop]) || currentProduct[prop]) : undefined}
                       onChange={value => {
                           const {show, currentProduct} = this.state;
                           changes = changes || {};
                           changes[prop] = value;
                           if (show === 'editPage')
                               this.setState({changes});
                           else if (show === 'createPage')
                               this.setState({currentProduct: {...currentProduct, ...changes}});
                       }}/>
            </div>
        )
    };

    renderList() {
        const {productsList = []} = this.state;
        return (
            <>
                {productsList.map((product, key) => (
                    <div key={key}>
                        <span>{product.name}</span>
                        <span onClick={() => this.show('editPage', product)} className='icon pencil'/>
                        <span onClick={() => this.deleteProduct(product._id)} className='icon remove-button'/>
                    </div>
                ))}
            </>
        )
    };

    render() {
        const {loading, show, currentProduct} = this.state;

        if (loading)
            return <Loading/>;

        let actions = this.buttons;
        if (show === 'editPage')
            actions = [...this.buttons, {name: 'удалить', types: 'danger', handler: this.deleteProduct}];

        return (
            <>
                <div className='c--items-group'>
                    <button className='c--btn c--btn--primary' onClick={() => this.show('createPage')}>add new</button>
                    <button className='c--btn c--btn--primary' onClick={this.handleExport}>Export csv</button>
                    <span>Import  csv</span>
                    <input type='file' onChange={this.handleUpload}/>
                </div>
                {this.renderList()}
                <Modal title='Редактирование' show={(show === 'editPage')} buttons={actions} onClose={this.close}>
                    <div>
                        {Object.keys(currentProduct || {}).map((prop, key) => (
                            <div key={key}>
                                {
                                    Array.isArray(currentProduct[prop]) ? (
                                        (prop === 'media') ? this.renderPropMedia(prop) : this.renderPropList(prop)
                                    ) : (
                                        (prop !== '_id') && this.renderProp(prop)
                                    )
                                }
                            </div>
                        ))}
                    </div>
                </Modal>
                <Modal title='Создание' show={(show === 'createPage')} buttons={actions} onClose={this.close}>
                    <div>
                        {['categoryID', 'code', 'name', 'price', 'slug'].map((prop, key) => this.renderProp(prop, key))}
                        <button>add image</button>
                        <button>add prop</button>
                    </div>
                </Modal>
            </>
        );
    };
};