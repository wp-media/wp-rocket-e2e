@lcpll @delaylcp @setup
Feature: Lazyload with LCP

  Background:
    Given I am logged in
    And delete 'wp-rocket' plugin
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

  #Scenario: Should exclude next-gen lcp/atf from LL
  #  Given I install plugin 'imagify'
  #  And plugin 'imagify' is activated
  #  When I am logged in
  #  And I go to 'wp-admin/options-general.php?page=imagify'
  #  And I save imagify API key
  #  And display next-gen is enabled on imagify
  #  And I visit page 'lcp_with_imagify' with browser dimension 1600 x 700
#    And page 'lcp_with_imagify' with images having next-gen avif, webp, avif/webp, no next gen is visited # I didn't get that
  #  When I clear cache
  #  And I visit page 'lcp_with_imagify' with browser dimension 1600 x 700
  #  Then lcp image markup is not written to LL format
#    And ATF image markup is not written to LL format
