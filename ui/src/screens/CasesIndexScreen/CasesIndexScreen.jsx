import React, { Component } from 'react';
import Waypoint from 'react-waypoint';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage, defineMessages } from 'react-intl';
import { debounce } from 'lodash';
import { Button, Icon } from '@blueprintjs/core';

import Query from "src/app/Query";
import { queryCollections, updateCollectionPermissions, createCollection } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import { Breadcrumbs, ErrorSection, DualPane, SectionLoading } from 'src/components/common';
import { CaseListItem } from 'src/components/Case';
import SearchFacets from 'src/components/Facet/SearchFacets';
import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';

import './CasesIndexScreen.css';

const messages = defineMessages({
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'You do not have any case files yet',
  },
  filter: {
    id: 'case.search_cases_placeholder',
    defaultMessage: 'Search cases'
  },
  not_found: {
    id: 'case.not.found',
    defaultMessage: 'Log in to create your own case files, upload documents and manage your investigations!'
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
  facet_team: {
    id: 'search.facets.facet.team',
    defaultMessage: 'Shared with'
  }
});


class CasesIndexScreen extends Component {
  constructor(props) {
    super(props);
    const {intl} = props;
    this.state = {
      createIsOpen: false,
      queryPrefix: props.query.getString('prefix'),
      facets: [
        {
          field: 'countries',
          label: intl.formatMessage(messages.facet_countries),
          icon: 'globe',
          defaultSize: 300
        }, {
          field: 'team.name',
          label: intl.formatMessage(messages.facet_team),
          icon: 'social-media',
          defaultSize: 20
        }
      ]
    };
    this.toggleCreateCase = this.toggleCreateCase.bind(this);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    let { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  toggleCreateCase() {
    this.setState({createIsOpen: !this.state.createIsOpen});
  }

  onChangeQueryPrefix({target}) {
    this.setState({queryPrefix: target.value});
    const query = this.props.query.set('prefix', target.value);
    this.updateQuery(query);
  }

  updateQuery(newQuery) {
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  getMoreResults() {
    const {query, result, queryCollections} = this.props;
    if (!result.isLoading && result.next) {
      queryCollections({query, next: result.next});
    }
  }

  render() {
    const {query, result, intl} = this.props;
    const {queryPrefix} = this.state;

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="cases.browser.breadcrumb"
                            defaultMessage="Cases overview"/>
        </a>
      </li>
    </Breadcrumbs>);

    return (
      <Screen className="CasesIndexScreen" breadcrumbs={breadcrumbs} requireSession={true}>
        <DualPane className="explainer">
          <DualPane.SidePane>
            <Icon icon="briefcase" iconSize={100}/>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            <h1 className='title-explanation'>
              <FormattedMessage id="case.question" defaultMessage="Manage your investigations"/>
            </h1>
            <p className='description-explanation'>
              <FormattedMessage id="case.description"
                                defaultMessage="Case files help you group and share the documents and data which belong to a particular story. You can upload documents, such as PDFs, email archives or spreadsheets, and they will be made easy to search and browse."/>
            </p>
            <div className="pt-control-group pt-large">
              <div className="pt-input-group pt-large">
                <i className="pt-icon pt-icon-search pt-large"/>
                <input className="pt-input"
                       placeholder={intl.formatMessage(messages.filter)}
                       onChange={this.onChangeQueryPrefix} value={queryPrefix}/>
              </div>
              <Button onClick={this.toggleCreateCase} icon="plus" className="pt-intent-primary pt-large">
                <FormattedMessage id="case.add" defaultMessage="New casefile"/>
              </Button>
            </div>
          </DualPane.ContentPane>
        </DualPane>
        <DualPane>
          <DualPane.SidePane>
            <SearchFacets facets={this.state.facets}
                          query={query}
                          result={result}
                          updateQuery={this.updateQuery}/>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            <div className="results">
              {result.results !== undefined && result.results.map(res =>
                <CaseListItem key={res.id} collection={res}/>
              )}
            </div>
            {result.total === 0 && (
              <div className='error-and-add-button'>
                <ErrorSection visual="search"
                              title={intl.formatMessage(messages.no_results_title)}/>
              </div>
            )}
            {!result.isLoading && result.next && (
              <Waypoint onEnter={this.getMoreResults}
                        bottomOffset="-600px"
                        scrollableAncestor={window}/>
            )}
            {result.isLoading && (
              <SectionLoading/>
            )}
          </DualPane.ContentPane>
        </DualPane>
        <CreateCaseDialog isOpen={this.state.createIsOpen}
                          toggleDialog={this.toggleCreateCase}/>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const context = {
    facet: ['countries', 'team.name'],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CasesIndexScreen = injectIntl(CasesIndexScreen);
CasesIndexScreen = connect(mapStateToProps, {
  queryCollections,
  updateCollectionPermissions,
  createCollection
})(CasesIndexScreen);
export default CasesIndexScreen;
