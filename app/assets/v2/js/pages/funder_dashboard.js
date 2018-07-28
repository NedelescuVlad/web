$(function () {
  function activatePayoutHistory() {
    var chart = updateChart(null);

    var $currentChartFilter = null;
    handleChartChange();

    function handleChartChange() {
      $('.funder-dashboard__payout-history__control').click(function () {
        if ($(this) !== $currentChartFilter) {
          var classSelected = 'funder-dashboard__payout-history__control--selected';
          $('.funder-dashboard__payout-history__control').removeClass(classSelected);
          $currentChartFilter = $(this);
          $currentChartFilter.addClass(classSelected);
          chart = updateChart(chart);
        }
      });
    }

    function updateChart(oldChart) {
      if (oldChart) {
        oldChart.clear();
      }
      return renderChart();
    }

    function renderChart() {
      var chartSettings = getChartSettings();
      return new Chart(chartSettings.context2d, {
        data: chartSettings.data,
        options: chartSettings.options,
        type: 'line'
      });
    }

    function getChartSettings() {
      var monthlyData = window.funderDashboardPayoutChartData.monthlyData;
      var weeklyData = window.funderDashboardPayoutChartData.weeklyData;
      var yearlyData = window.funderDashboardPayoutChartData.yearlyData;

      var filterBaseSel = 'funder-dashboard__payout-history__control';

      var $selected = $(classSel(filterBaseSel) + '--selected');
      var isWeekly = $selected.hasClass(filterBaseSel + '--weekly');
      var isMonthly = $selected.hasClass(filterBaseSel + '--monthly');
      var isYearly = $selected.hasClass(filterBaseSel + '--yearly');

      var plotData = null;
      var labels = null;
      if (isWeekly) {
        plotData = weeklyData.data;
        labels = weeklyData.labels;
      } else if (isMonthly) {
        plotData = monthlyData.data;
        labels = monthlyData.labels;
      } else if (isYearly) {
        plotData = yearlyData.data;
        labels = yearlyData.labels;
      }

      var data = {
        datasets: [{
          data: plotData,
          borderColor: '#3e00ff',
          backgroundColor: '#eff7fd',
          lineTension: 0,
          fillColor: '#eff7fd',
        }],
        labels: labels,
      };

      var options = {
        scales: {
          yAxes: [
            {
              ticks: {
                callback: function (value, index, labels) {
                  return '$' + value;
                }
              },
            }
          ],
        },
        legend: {
          display: false
        }
      };

      var context2d = document.getElementById("funder-dashhboard__payout-history__chart").getContext("2d");

      return {
        data: data,
        options: options,
        context2d: context2d
      }
    }
  };

  function activateTotalBudget() {
    var $totalBudget = $('.funder-dashboard__stats__stat--total-budget__budget-input');

    $totalBudget.keypress(function(e) {
      if (e.key == "Enter") {
        console.log("User inputted total budget: \r\n" + this.value);
      }
    });

    console.log($totalBudget.val());
  };

  // used both by bounties and outgoing funds
  // any object the resulting fns are to be used on must have the created_on and worthDollars properties
  function getSortFn(sortFilterVal) {
    switch (sortFilterVal) {
      case 'Recent':
        return function(fund1, fund2) {
          return dateComparison(fund1.created_on, fund2.created_on);
        }
      case 'Oldest':
        return function(fund1, fund2) {
          return -dateComparison(fund1.created_on, fund2.created_on);
        }
      case 'Highest Value':
        return function(fund1, fund2) {
          return -(parseFloat(fund1.worthDollars) - parseFloat(fund2.worthDollars));
        }
      case 'Lowest Value':
        return function(fund1, fund2) {
          return parseFloat(fund1.worthDollars) - parseFloat(fund2.worthDollars);
        }
      default:
        return function() {
          return 0;
        }
    }
  };

  // TODO: date1 and date2 are datetime objects coming from the api. Need a way to compare them
  function dateComparison(date1, date2) {
    if (date1 < date2) {
      return -1;
    }

    if (date1 > date2) {
      return 1;
    }

    return 0;
  }

  function activateOutgoingFunds(outgoingFunds) {
    var $container = $('.funder-dashboard__outgoing-funds__funds');
    var $fundTemplate = $('.funder-dashboard__outgoing-funds__funds__fund--template');

    var fundBaseSel = 'funder-dashboard__outgoing-funds__funds__fund';
    var cbRenderFunds = renderOutgoingFunds.bind(this, $container, $fundTemplate, fundBaseSel);

    var getFunds = getOutgoingFunds.bind(this, outgoingFunds, cbRenderFunds);

    getFunds();
    $('.funder-dashboard__outgoing-funds__filter').change(function () {
      clearFunds();
      getFunds();
    });

    function clearFunds() {
      $container.find(classSel(fundBaseSel + ':not(' + classSel(fundBaseSel) + '--template)')).remove();
    }

    function renderOutgoingFunds($container, $fundTemplate, fundBaseSel, funds) {
      for (var i = 0; i < funds.length; ++i) {
        var fund = funds[i];

        var $clone = $fundTemplate.clone();
        updateBemElementInParent($clone, fundBaseSel, 'id', fund.id);
        updateBemElementInParent($clone, fundBaseSel, 'title', fund.title);
        updateBemElementInParent($clone, fundBaseSel, 'type', fund.type);
        updateBemElementInParent($clone, fundBaseSel, 'status', fund.status);
        $clone.find(classSel(fundBaseSel) + '__view-etherscan').attr('href', fund.etherscanLink);
        updateBemElementInParent($clone, fundBaseSel, 'worth__dollars', fund.worthDollars);
        updateBemElementInParent($clone, fundBaseSel, 'worth__eth', fund.worthEth);

        if (fund.status === 'Pending') {
          $clone.addClass(fundBaseSel + '--pending')
        }

        $clone.removeClass(fundBaseSel + '--template');
        $container.append($clone);
      }
    }

    function getOutgoingFunds(funds, cbRenderFunds) {
      var filterBaseSel = 'funder-dashboard__outgoing-funds__filter';

      var typeStatusFilter = getTypeOrStatusFilter(filterBaseSel);
      var sortFilter = getSortByFilter(filterBaseSel);

      var filteredFunds = funds.filter(function (fund) {
        if (typeStatusFilter.data('is-all-filter')) {
          return true;
        }

        if (typeStatusFilter.data('is-type-filter')) {
          return fund.type.toUpperCase() === typeStatusFilter.val().toUpperCase();
        } else if (typeStatusFilter.data('is-status-filter')) {
          return fund.status.toUpperCase() === typeStatusFilter.val().toUpperCase();
        }
      });

      var sortFn = getSortFn(sortFilter.val());
      filteredFunds = filteredFunds.sort(function(fund1, fund2) {
        return sortFn(fund1, fund2);
      });

      cbRenderFunds(filteredFunds);

      function getTypeOrStatusFilter(filterBaseSel) {
        return $(classSel(filterBaseSel) + '--type-or-status').find(':selected');
      }

      function getSortByFilter(filterBaseSel) {
        return $(classSel(filterBaseSel) + '--age-or-value').find(':selected');
      }
    }
  }

  function updateBemElementInParent($parent, classSelectorBase, elementName, elementValue) {
    var $element = $parent.find(classSel(classSelectorBase) + '__' + elementName);
    update($element, elementValue);

    function update($el, htmlContent) {
      $el.html(htmlContent);
    }
  }

  function classSel(className) {
    return '.' + className;
  }

  function activateAllBounties(bounties) {
    var $container = $('.funder-dashboard__all-bounties__bounties');
    var $bountyTemplate = $('.funder-dashboard__all-bounties__bounties__bounty--template');

    var bountyBaseSel = 'funder-dashboard__all-bounties__bounties__bounty';
    var cbRenderBounties = renderBounties.bind(this, $container, $bountyTemplate, bountyBaseSel);
    var getBounties = getBounties.bind(this, bounties, cbRenderBounties);

    getBounties();
    $('.funder-dashboard__all-bounties__filter').change(function () {
      clearBounties();
      getBounties();
    });

    function clearBounties() {
      $container.find(classSel(bountyBaseSel + ':not(' + classSel(bountyBaseSel) + '--template)')).remove();
    }

    function renderBounties($container, $bountyTemplate, bountyBaseSel, bounties) {
      for (var i = 0; i < bounties.length; ++i) {
        var $clone = $bountyTemplate.clone();
        var bounty = bounties[i];

        updateBemElementInParent($clone, bountyBaseSel, 'id', bounty.id);
        updateBemElementInParent($clone, bountyBaseSel, 'title', bounty.title);
        updateBemElementInParent($clone, bountyBaseSel, 'type', bounty.type);
        updateBemElementInParent($clone, bountyBaseSel, 'status', bounty.status);
        $clone.find(classSel(bountyBaseSel) + '__view-github').attr('href', bounty.githubLink);
        updateBemElementInParent($clone, bountyBaseSel, 'worth__dollars', bounty.worthDollars);
        updateBemElementInParent($clone, bountyBaseSel, 'worth__eth', bounty.worthEth);

        if (bounty.status === 'started') {
          $clone.addClass(bountyBaseSel + '--started');
        }
        else if (bounty.status === 'stopped') {
          $clone.addClass(bountyBaseSel + '--stopped');
        }
        else if (bounty.status === 'submitted') {
          $clone.addClass(bountyBaseSel + '--submitted');
        }
        else if (bounty.status === 'open') {
          $clone.addClass(bountyBaseSel + '--open');
        }

        $clone.removeClass(bountyBaseSel + '--template');
        $container.append($clone);
      }
    }

    function getBounties(bounties, cbRenderBounties) {
      var filterBaseSel = 'funder-dashboard__all-bounties__filter';

      var $typeStatusFilter = getTypeOrStatusFilter(filterBaseSel);
      var $sortFilter = getSortByFilter(filterBaseSel);

      var filteredBounties = bounties.filter(function (fund) {
        if ($typeStatusFilter.data('is-all-filter')) {
          return true;
        }

        if ($typeStatusFilter.data('is-type-filter')) {
          return fund.typeTipOrPayment.toUpperCase() === $typeStatusFilter.val().toUpperCase();
        } else if ($typeStatusFilter.data('is-status-filter')) {
          // 'Pending' || 'Claimed'
          return fund.statusPendingOrClaimed.toUpperCase() === $typeStatusFilter.val().toUpperCase();
        }
      });

      var sortFn = getSortFn($sortFilter.val());
      filteredBounties = filteredBounties.sort(function(fund1, fund2) {
        return sortFn(fund1, fund2);
      });

      cbRenderBounties(filteredBounties);

      function getTypeOrStatusFilter(filterBaseSel) {
        return $(classSel(filterBaseSel) + '--type-or-status').find(':selected');
      }

      function getSortByFilter(filterBaseSel) {
        return $(classSel(filterBaseSel) + '--age-or-value').find(':selected');
      }
    }
  }

  function activateLinksToIssueExplorer() {
    var localStorage;

    try {
      localStorage = window.localStorage;
    } catch (e) {
      // Won't throw an error when doing things with localStorage, but will be useless when redirecting to issueExplorer.
      // Not a big issue, but funders with no localStorage support will just get redirected to the explorer
      // without applied filters
      localStorage = {};
    }

    var baseLinkSel = 'issue-explorer-link';
    var $links = $('.' + baseLinkSel);

    $links.click(function(e) {
      e.preventDefault();
      var $this = $(this);
      var href = $this.attr('href');

      resetFilters();

      if ($this.hasClass(baseLinkSel + '--bounties--expiring')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
        addToLocalStorage('idx_status', 'open');
        addToLocalStorage('order_by', 'web3_created');
      } else if ($this.hasClass(baseLinkSel + '--bounties--active')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
        addToLocalStorage('idx_status', 'open');
      } else if ($this.hasClass(baseLinkSel + '--bounties--completed')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
        addToLocalStorage('idx_status', 'done');
      } else if ($this.hasClass(baseLinkSel + '--bounties--expired')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
        addToLocalStorage('idx_status', 'expired');
      } else if ($this.hasClass(baseLinkSel + '--contributors-comments')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
        // TODO: How do I get the issues with new comments? Or is it fine to just redirect to open issues?
        addToLocalStorage('idx_status', 'open');
      } else if ($this.hasClass(baseLinkSel + '--payments--all')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
        // TODO: I need something similar to status_in. Also, is "paid" the same as "done"?
      } else if ($this.hasClass(baseLinkSel + '--bounties--all')) {
        addToLocalStorage('bounty_owner_github_username', document.contxt.github_handle);
      }

      function addToLocalStorage(key, value) {
        localStorage[key] = value;
      }

      window.location.href = href;
    });

    var sidebar_keys = [
      'experience_level',
      'project_length',
      'bounty_type',
      'bounty_filter',
      'network',
      'idx_status',
      'tech_stack',
      'project_type',
      'permission_type'
    ];

    var resetFilters = function() {
      for (var i = 0; i < sidebar_keys.length; i++) {
        var key = sidebar_keys[i];
        localStorage[key] = null;
      }

      localStorage['bounty_owner_github_username'] = null;

      if (localStorage['keywords']) {
        localStorage['keywords'].split(',').forEach(function (v, k) {
          localStorage['keywords'] = localStorage['keywords'].replace(v, '').replace(',,', ',');
          // Removing the start and last comma to avoid empty element when splitting with comma
          localStorage['keywords'] = localStorage['keywords'].replace(/^,|,\s*$/g, '');
        });
      }
    };
  }

  activatePayoutHistory();
  activateTotalBudget();
  activateLinksToIssueExplorer();

  var outgoingFunds = window.outgoingFunds.items;
  var funderBounties = window.allBounties.items;

  activateOutgoingFunds(outgoingFunds);
  activateAllBounties(funderBounties.slice(0, 10));
});

