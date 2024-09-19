@lcpll
Feature: Lazyload with LCP

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I save settings 'media' 'lazyloadCssBgImg'

  Scenario: Should Exclude LCP/ATF from Lazyload
    Given I visit page 'lcp_with_imagify' with browser dimension 1600 x 700
    When I am logged in
    And I clear cache
    Then lcp image markup is not written to LL format
#    And ATF image markup is not written to LL format

  Scenario: Should exclude next-gen lcp/atf from LL
    Given plugin is installed 'imagify'
    And plugin is activated
    And I go to 'wp-admin/options-general.php?page=imagify'
    And I save imagify API key
    And display next-gen is enabled on imagify
#    And page 'lcp_with_imagify' with images having next-gen avif, webp, avif/webp, no next gen is visited # I didn't get that
    When I clear cache
    And I visit page 'lcp_with_imagify' with browser dimension 1600 x 700
    Then lcp image markup is not written to LL format
#    And ATF image markup is not written to LL format
