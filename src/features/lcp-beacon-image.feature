@lcp @setup
Feature: Fetchpriority should be applied to image

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'

  Scenario: When I visited a page that has LCP with relative image
    When I log out
    And I visit page 'lcp_regular_image_template' with browser dimension 1600 x 700
    And I scroll to bottom of page
    And I am logged in
    And I clear cache
    And I log out
    And I visit page 'lcp_regular_image_template' with browser dimension 1600 x 700
    And I scroll to bottom of page
    Then lcp image should have fetchpriority