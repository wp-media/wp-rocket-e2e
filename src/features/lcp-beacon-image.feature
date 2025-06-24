@lcp @setup
Feature: Fetchpriority should be applied to image

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I log out
  Scenario: Should add fetchpriority to lcp image
    When I visit beacon driven page 'lcp_regular_image_template' with browser dimension 1600 x 700
    And I am logged in
    And I clear cache
    And I log out
    And I visit page 'lcp_regular_image_template' with browser dimension 1600 x 700
    Then lcp image should have fetchpriority