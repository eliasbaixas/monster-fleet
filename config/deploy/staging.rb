set :rvm_ruby_string, 'ruby-1.9.2@monsters'
# Or:
#set :rvm_ruby_string, ENV['GEM_HOME'].gsub(/.*\//,"") # Read from local system
# Load RVM's capistrano plugin.
require "rvm/capistrano"

require 'bundler'
ENV["BUNDLE_GEMFILE"] = File.expand_path("../../../Gemfile", __FILE__)
Bundler.setup
require 'bundler/capistrano'

load 'deploy'

before 'deploy:setup', 'rvm:install_rvm'
before 'deploy:setup', 'rvm:install_ruby'

# set :default_environment, {
#   "PATH" => "/opt/ruby-1.9.2-p320/bin:#{ENV['PATH']}",
#   'RUBY_VERSION' => 'ruby 1.9.2',
#   'GEM_HOME' => "/opt/ruby-1.9.2-p320/gems",
#   'GEM_PATH' => '/path/to/.rvm/gems/ree/1.8.7' 
# }

default_run_options[:pty] = true
set :application, "monster-fleet"
set :repository, "git://github.com/eliasbaixas/monster-fleet.git"
set :keep_releases, 3
set :rails_env, "staging"
set :scm, :git
set :host, "monsters.baixas.net"
set :deploy_root, "/data/www/monsters"
set :deploy_to, "/data/www/monsters/#{application}"
# set :deploy_via, :remote_cache
# set :repository_cache, "music_map_cache"
set :git_enable_submodules, 1
set :use_sudo, false
# deploy:start, deploy:stop and deploy:restart runner
set :runner, "www-data"
# deploy:setup and deploy:cleanup runner (admin)
# if unset, they run as root
# if you want it to be runner, set :admin_runner to runner
set :admin_runner, "www-data"

role :app, "monsters.baixas.net"
role :web, "monsters.baixas.net"
role :db, "monsters.baixas.net", :primary => true

desc "Returns last lines of log file. Usage: cap log [-s lines=100] [-s rails_env=staging]"  
task :log do
  lines     = variables[:lines] || 100
  rails_env = variables[:rails_env] || 'staging'  
  run "tail -n #{lines} #{shared_path}/log/#{rails_env}.log" do |ch, stream, out|  
    puts out  
  end
end

desc "Remote console on the staging appserver"
task :console, :roles => :app do
  input = ''
  run "cd #{current_path} && ./script/console staging" do
    |channel, stream, data|
    next if data.chomp == input.chomp || data.chomp == ''
    print data
    channel.send_data(input = $stdin.gets) if data =~ /^(>|\?)>/
  end
end

namespace :deploy do
  task :symlink_data_dir do
    puts 'Linking public/data directory...'
    run "ln -nfs #{shared_path}/system/matteo #{release_path}/public/data"
  end
  task :symlink_files_dir do
    puts 'Linking public/files directory...'
    run "ln -nfs #{shared_path}/files #{release_path}/public/files"
  end
  task :create_files_dir do
    run "mkdir -p #{shared_path}/files"
  end
  after "setup", "deploy:create_files_dir"
  after "deploy", "deploy:symlink_files_dir"
  after "deploy", "deploy:symlink_data_dir"
end

namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end

  task :stop, :roles => :app do
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "test -f #{current_path}/tmp/pids/server.pid && kill $(cat #{current_path}/tmp/pids/server.pid); true"
    run "cd #{current_path}; nohup rails server -p 4000 -e staging &"
  end
end
