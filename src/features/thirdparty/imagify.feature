@lcp @delaylcp @setup @imagify-compatibility
Feature: Lazyload with LCP using imagify

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin 'wp-rocket' is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I save settings 'media' 'lazyloadCssBgImg'
    And I save settings 'media' 'lazyload'
    And I save settings 'media' 'lazyloadIframes'
    And I save settings 'media' 'lazyloadYoutube'
    And I install plugin 'imagify'
    And plugin 'imagify' is activated
    And Imagify is set up

  Scenario: Should exclude next-gen lcp-atf from LL
    Given I log out
    And I visit page 'lcp_with_imagify' and check for lcp
    When I am logged in
    And I clear cache
    And I log out
    Then I visit the 'lcp_with_imagify' and check lcp-atf are not lazyloaded
    
  Scenario: Should exclude Imagify next-gen lcp-atf from LL while display next-gen on
    Given display next-gen is enabled on imagify
    When I log out
    And I visit page 'lcp_with_imagify' and check for lcp
    When I am logged in
    And I clear cache
    And I log out
    Then I visit the 'lcp_with_imagify' and check lcp-atf are not lazyloaded

