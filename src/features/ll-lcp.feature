@lcpll
Feature: Lazyload with LCP

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I save settings 'media' 'lazyloadCssBgImg'

  Scenario: Should Exclude LCP/ATF from Lazyload
    Given I visit page '[TEMPLATE]' with browser dimension 1600 x 700
    When I clear cache
    Then lcp image markup is not written to LL format
    And ATF image markup is not written to LL format

  Scenario: Should exclude next-gen lcp/atf from LL
    Given plugin is installed 'imagify'
    And display next-gen is enabled on imagify # Create this step
    And page with images having next-gen avif, webp, avif/webp, no next gen is visited # I didn't get that
    When I clear cache
    And I visit the page '[TEMPLATE]'  with dimension 1600 x 700
    Then lcp image markup is not written to LL format
    And ATF image markup is not written to LL format
