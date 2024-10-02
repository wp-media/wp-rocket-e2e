@lcpll @delaylcp @setup
Feature: Lazyload with LCP

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin 'wp-rocket' is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I save settings 'media' 'lazyloadCssBgImg'

  Scenario: Should Exclude LCP/ATF from Lazyload
    And I clear cache
    When I log out
    And I visit the urls for 'desktop'
    When I am logged in
    And I clear cache
    And I visit the urls and check for lazyload
    Then lcp and atf images are not written to LL format

  Scenario: Should exclude next-gen lcp/atf from LL
    Given I install plugin 'imagify'
    And plugin 'imagify' is activated
    When I am logged in
    And Imagify is set up
    When I log out
    And I visit page 'lcp_with_imagify' and check for lcp
    When I am logged in
    And I save settings 'media' 'lazyloadCssBgImg'
    And I clear cache
    And I visit the 'lcp_with_imagify' and check lcp-atf are not lazyloaded
    Then lcp and atf images are not written to LL format

  Scenario: Should exclude next-gen lcp/atf from LL
    When I am logged in
    And display next-gen is enabled on imagify
    When I log out
    And I visit page 'lcp_with_imagify' and check for lcp
    When I am logged in
    And I save settings 'media' 'lazyloadCssBgImg'
    And I clear cache
    And I visit the 'lcp_with_imagify' and check lcp-atf are not lazyloaded
    Then lcp and atf images are not written to LL format

